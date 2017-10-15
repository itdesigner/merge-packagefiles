"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = require("fs");
var EntryType;
(function(EntryType) {
    EntryType[EntryType["PRIMITIVE"] = 0] = "PRIMITIVE";
    EntryType[EntryType["OBJECT"] = 1] = "OBJECT";
    EntryType[EntryType["ARRAY"] = 2] = "ARRAY";
})(EntryType || (EntryType = {}));

function merge(target, source, overwrite) {
    const mergeResult = target;
    Object.entries(source).forEach(([key, value]) => {
        if (target.hasOwnProperty(key)) {
            // already an entry => decide what to do
            const type = (Array.isArray(value)) ? EntryType.ARRAY : ((typeof(value) === 'object') ? EntryType.OBJECT : EntryType.PRIMITIVE);
            switch (type) {
                case EntryType.ARRAY:
                    // merge the two arrays - unless overwrite specified
                    mergeResult[key] = (overwrite.indexOf(key) > -1) ? source[key] : combineAndFilterArrays(target[key], source[key]);
                    break;
                case EntryType.OBJECT:
                    // recursive loop
                    // first we need to filter the overwrite list to only those items that start with the current key
                    const o = filterOverwriteList(overwrite, key);
                    mergeResult[key] = merge(target[key], source[key], o);
                    break;
                case EntryType.PRIMITIVE:
                    // overwrite the original value if in the overwrites list
                    if (overwrite.indexOf(key) > -1) {
                        mergeResult[key] = value;
                    }
                    break;
            }
        } else {
            // doesn't exist = > plug it in immeidately
            mergeResult[key] = value;
        }
    });
    return mergeResult;
}

function combineAndFilterArrays(arr1, arr2) {
    return arr1.concat(arr2.filter((item) => {
        return arr1.indexOf(item) < 0;
    }));
}

function filterOverwriteList(list, key) {
    const filteredList = [];
    list.forEach((item) => {
        if (item.startsWith(key + '.')) {
            filteredList.push(item.replace(key + '.', ''));
        }
    });
    return filteredList;
}

function readSync(filename, options) {
    options = options || {};
    if (typeof options === 'string') {
        options = JSON.parse(options);
    }
    const fs = (options && options.fs) ? options.fs : _fs;
    const shouldThrow = (options && options.throws) ? options.throws : true;
    try {
        const contents = (options && options.encoding) ? fs.readFileSync(filename, options.encoding) : fs.readFileSync(filename);
        const content = stripBom(contents);
        return (options && options.reviver) ? JSON.parse(content, options.reviver) : JSON.parse(content);
    } catch (err) {
        if (shouldThrow) {
            const e = new Error(filename + ': ' + err);
            throw e;
        } else {
            return {};
        }
    }
}

function writeSync(filename, content, options) {
    options = options || {};
    const fs = options.fs || _fs;
    const str = stringify(content, options);
    // not sure if fs.writeFileSync returns anything, but just in case
    return fs.writeFileSync(filename, str, options);
}

function stripBom(content) {
    if (Buffer.isBuffer(content)) {
        content = content.toString('utf8');
    }
    content.replace(/^\uFEFF/, '');
    return content;
}

function stringify(obj, options) {
    const spaces = (options && options.spaces) ? options.spaces : undefined;
    const EOL = (options && options.EOL) ? options.EOL : '\n';
    const replacer = (options && options.replacer) ? options.replacer : null;
    const str = JSON.stringify(obj, replacer, spaces);
    return str.replace(/\n/g, EOL) + EOL;
}

function exists(filename) {
    return _fs.existsSync(filename);
}
exports.exists = exists;

function createpackage(targetFilePath, templateFilePath, overwrite) {
    const targetObject = readSync(targetFilePath);
    const templateObject = readSync(templateFilePath);
    const writeOptions = {
        spaces: 4,
    };
    const ow = overwrite || [];
    const r = merge(targetObject, templateObject, ow);
    writeSync(targetFilePath, r, writeOptions);
}
exports.default = createpackage;