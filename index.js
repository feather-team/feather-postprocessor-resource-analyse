var RESOURCE_REG = /[\r\n]*(?:<!--[\s\S]*?-->|<script([^>]*?src=(['"])((?:<\?[\s\S]+?\?>)?.+?)\2[\s\S]*?)>\s*<\/script>|<link([^>]*?href=(['"])((?:<\?[\s\S]+?\?>)?.+?)\5[\s\S]*?)>)[\r\n]*/ig;
var FIXED = /\b(?:feather-position|data|data-position)-fixed\b/i, HEAD = /\b(?:feather-position|data|data-position)-head\b/i, BOTTOM = /\b(?:feather-position|data|data-position)-bottom\b/i, DESTIGNORE = /\b(?:feather-position|data|data-position)-ignore\b/i;
var ISCSS = /rel=["']?stylesheet['"]?/i;

var PREVIEW_MODE = (feather.settings || {}).dest == 'preview', STATIC_MODE = feather.config.get('staticMode');

module.exports = function(content, file, conf){
    var headJs = [], bottomJs = [], css = [], content = file.getContent();

    if(!STATIC_MODE){
        var analyses = content.match(/<?php \/\*FEATHER_RESOURCE_ANALYSE:([\s\S]+?)\*\/\?>/);

        if(analyses){
            var extras = (new Function('return ' + analyses[1]))();

            file.extras.headJs = extras.headJs;
            file.extras.bottomJs = extras.bottomJs;
            file.extras.css = extras.css;

            return content;
        }
    }

    // //将分析的requires添加至资源表中
    for(var i = 0; i < file.requires.length; i++){
        var url = file.requires[i];
        var tmpFile = feather.file.wrap(url);
        
        url = tmpFile.exists() ? tmpFile.subpath : url;

        if(tmpFile.isCssLike){
            css.push(url);
        }else if(!tmpFile.isHtmlLike){
            bottomJs.push(url);
        }       

        file.requires.splice(i--, 1);
    }

    content = content.replace(RESOURCE_REG, function(_0, _1, _2, _3, _4, _5, _6){
        //如果是fixed 跳过
        if(_1 && !FIXED.test(_1)){
            if(!PREVIEW_MODE){
                if(DESTIGNORE.test(_1)) return '';
            }

            //头部js
            if(HEAD.test(_1)){
                headJs.push(_3);
            }else{
                //尾部js
                bottomJs.push(_3);
            }

            return '';
        }else if(_4 && ISCSS.test(_4)){
            if(!PREVIEW_MODE){
                if(DESTIGNORE.test(_4)) return '';
            }

            //css
            css.push(_6);
            return '';
        }

        return _0;
    });

    if(!file.isPageletLike){
        var sameCss = feather.file.wrap(file.id.replace(/\.[^\.]+$/, '.css'));

        if(sameCss.exists()){
            css.push(sameCss.subpath);
        }   
    }

    file.extras.headJs = (file.extras.headJs || []).concat(headJs);
    file.extras.bottomJs = (file.extras.bottomJs || []).concat(bottomJs);
    file.extras.css = (file.extras.css || []).concat(css);

    if(!STATIC_MODE){
        content = '<?php /*FEATHER_RESOURCE_ANALYSE:' + feather.util.json({
            headJs: file.extras.headJs,
            bottomJs: file.extras.bottomJs,
            css: file.extras.css
        }) + '*/?>' + content;
    }

    return content;
};