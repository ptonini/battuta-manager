function File() {

    return {
        name: '',
        new_name: null,
        type:  null,
        size:  null,
        modified:  null,
        root:  null,
        folder:  null,
        is_valid:  null,
        error:  null,
        owner: null
    }

}

File.getData = function (file, action, callback) {

    getData(file, paths.filesApi + action + '/', callback);

};

File.postData = function (file, action, callback) {

    postData(file, paths.filesApi + action + '/', callback);

};