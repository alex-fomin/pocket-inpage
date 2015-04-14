requirejs.config({
    "baseUrl": "libs",
    "paths": {
        "js": "../js"
    },
    shim: {
        underscore: {
            exports: '_'
        }
    }
});

requirejs(["js/inpage"]);