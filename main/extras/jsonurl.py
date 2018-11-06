import urllib, re

def query_string(d):
    args = dict_to_args(d)
    keys = args.keys()
    keys.sort()
    return "&".join([key + "=" + args[key] for key in keys])

def parse_query(q):
    q = q.strip()
    if q == "":
        return {}
    if q.startswith("?"):
        q = q[1:]
    arr = [pair.split("=") for pair in q.split("&")]
    args = {}
    for k, v in arr:
        args[k] = v
    return args_to_dict(args)

def param_quote(value):
    return urllib.parse.quote_plus(value)
    
def param_unquote(value):
    return urllib.parse.unquote_plus(value)

def type_cast(value):
    try:
        return int(value)
    except ValueError:
        return value

def dot_escape(s):
    return s.replace(".", "..")

def list_to_args(l):
    args = {}
    pos = 0
    for i in l:
        if type(i) == dict:
            sub = dict_to_args(i)
            for s, nv in sub.items():
                args[str(pos) + "." + s] = nv
        elif type(i) == list:
            sub = list_to_args(i)
            for s, nv in sub.items():
                args[str(pos) + "." + s] = nv
        else:
            args[str(pos)] = param_quote(str(i))
        pos += 1
    return args

def dict_to_args(d):
    args = {}
    for k, v in d.items():
        if type(v) == dict:
            sub = dict_to_args(v)
            for s, nv in sub.items():
                args[param_quote(dot_escape(k)) + "." + s] = nv
        elif type(v) == list:
            sub = list_to_args(v)
            for s, nv in sub.items():
                args[param_quote(dot_escape(k)) + "." + s] = nv
        else:
            args[param_quote(dot_escape(k))] = param_quote(str(v))
    return args

def dot_split(s):
    return [param_unquote(part).replace("..", ".") for part in re.split("(?<!\.)\.(?!\.)", s)]

def args_to_dict(args):
    d = {}
    keys = args.keys()
    sorted(keys)
    #keys.sort()

    for arg in keys:
        value = args[arg]
        
        #bits = arg.split(".")
        bits = dot_split(arg)
        ctx = d
        
        for i in range(len(bits)):
            bit = bits[i]
            last = not (i < len(bits) - 1)
            
            next_is_dict = False
            if not last:
                try:
                    int(bits[i + 1])
                except ValueError:
                    next_is_dict = True
            
            if type(ctx) == dict:
                if bit not in ctx:
                    if not last:
                        ctx[bit] = {} if next_is_dict else []
                        ctx = ctx[bit]
                    else:
                        ctx[bit] = type_cast(param_unquote(value))
                        ctx = None
                else:
                    ctx = ctx[bit]
            elif type(ctx) == list:
                if not last:
                    if int(bit) > len(ctx) - 1:
                        ctx.append({} if next_is_dict else [])
                    #ctx.append({} if next_is_dict else [])
                    ctx = ctx[int(bit)]
                else:
                    ctx.append(type_cast(param_unquote(value)))
                    ctx = None
    return d