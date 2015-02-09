var RESOURCE_REG = /[\r\n]*(?:<!--[\s\S]*?-->|<script([^>]*?src=(['"])((?:<\?[\s\S]+?\?>)?.+?)\2[\s\S]*?)>\s*<\/script>|<link([^>]*?href=(['"])((?:<\?[\s\S]+?\?>)?.+?)\5[\s\S]*?)>)[\r\n]*/ig;
var FIXED = /\b(?:feather-position|data|data-position)-fixed\b/i, HEAD = /\b(?:feather-position|data|data-position)-head\b/i, BOTTOM = /\b(?:feather-position|data|data-position)-bottom\b/i, DESTIGNORE = /\b(?:feather-position|data|data-position)-ignore\b/i;
var ISCSS = /rel=["']?stylesheet['"]?/i;

var PREVIEW_MODE = (feather.settings || {}).dest == 'preview';

module.exports = function(content, file, conf){
    var headJs = [], bottomJs = [], css = [], content = file.getContent();

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
        }else if(_4 && !FIXED.test(_4) && ISCSS.test(_4)){
            if(!PREVIEW_MODE){
                if(DESTIGNORE.test(_4)) return '';
            }

            //css
            css.push(_6);
            return '';
        }

        return _0;
    });


    var sameCss = feather.file.wrap(file.id.replace(/\.[^\.]+$/, '.css'));
    

    if(sameCss.exists()){
        css.push(sameCss.subpath);
    }

        // var sameJs = feather.file.wrap(file.id.replace(/\.[^\.]+$/, '.js'));

        // if(sameJs.exists()){
        //     bottomJs.push(sameJs.subpath);
        // }          

	file.extras.headJs = headJs;
	file.extras.bottomJs = bottomJs;
	file.extras.css = css;

	return content;
};