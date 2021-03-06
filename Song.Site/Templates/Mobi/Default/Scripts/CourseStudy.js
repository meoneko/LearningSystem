﻿$(function () {
    setStyle();
    //setEvent();
    //附件下载,如果是pdf则预览
    mui('body').on('tap', '#access a', function () {
        var href = $(this).attr("href");
        var exist = "";
        if (href.indexOf("?") > -1) href = href.substring(0, href.indexOf("?"));
        if (href.indexOf(".") > -1) exist = href.substring(href.lastIndexOf(".") + 1).toLowerCase();
        if (exist != "pdf") {
            document.location.href = this.href;
        } else {
            var tit = $.trim($(this).text());
            var pdfview = $().PdfViewer(href);
            var box = new PageBox(tit, pdfview, 100, 100);
            $("#videobox").hide();
            $('video').trigger('pause');
            PageBox.OverEvent = function () {
                $("#videobox").show();
                //$('video').trigger('play');
            }
            box.Open();
        }
        return false;
    });
});
//章节相关
$(function () {
    //章节的链接
    mui('body').on('tap', '.outline a', function () {
        var type = $(this).attr("type");
        //如果是未完结的，链接不可用
        if (type == "nofinish") return false;
		//如果是未购买，则提示购买
        if (type == "buy") {
            var msg = new MsgBox("购买课程", "当前章节需要购买后学习，点击“确定”进入课程购买。", 90, 220, "confirm");
            msg.href = this.href;
            msg.EnterEvent = function () {
                window.location.href = msg.href;
                msg.Close(msg.WinId);
            }
            msg.Open();
            return false;
        }
		window.location.href = this.href;
        return false;
    });
	//当前章节特殊显示
	var curr_olid=$("ul[curr_olid]").attr("curr_olid");
	$("ul[curr_olid] li[olid]").each(function(index, element) {
        var olid=$(this).attr("olid");
		if(olid==curr_olid)$(this).addClass("curr_ol");
    });
	//计算章节序号（树形排序）
    $(".outline").each(function () {
        var xpath = $(this).attr("xpath");
        $(this).find("a").html("<span class='tax'>" + xpath + "</span>" + $(this).find("a").html());
    });
});

//设置章节样式
function setStyle() {
    $(".outline .olitem").each(function () {
        var id = $().getPara("id");
        var olid = $(this).attr("olid");
        if (id == olid) $(this).addClass("current");
    });
}
//设置选项卡事件
function setEvent() {
    //选项卡事件
    mui('body').on('tap', '.tabs .tab', function () {
        return setTab($(this));
    });
    function setTab(tab) {
        var txt = $.trim(tab.text());
        var contexts = $("div[tab]");
        contexts.hide();
        contexts.each(function () {
            var t = $.trim($(this).attr("tab"));
            if (t == txt) {
                $(this).show();
            }
        });
        $(".tabs .tab").removeClass("curr");
        tab.addClass("curr");
        return false;
    }
    var btn = document.getElementById("tabfirst");
    mui.trigger(btn, 'tap');
}


/* 获取观看的累计时间，单位：秒 */
var watchTime = 0;
var setT = null;
//如果你不需要某项设置，可以直接删除，注意var flashvars的最后一个值后面不能有逗号
function loadedHandler() {
    if (CKobject.getObjectById('ckplayer_videobox').getType()) {//说明使用html5播放器
        CKobject.getObjectById('ckplayer_videobox').addListener('play', function (b) {
            setT = window.setInterval(setFunction, 1000);
        });
        CKobject.getObjectById('ckplayer_videobox').addListener('pause', function (b) {
            if (setT != null) window.clearInterval(setT);
        });
        CKobject.getObjectById('ckplayer_videobox').addListener('time', timeHandler);
    }
    else {
        CKobject.getObjectById('ckplayer_videobox').addListener('paused', 'pausedHandler');
        CKobject.getObjectById('ckplayer_videobox').addListener('time', 'timeHandler');
    }
}

function pausedHandler(b) {
    if (setT != null) window.clearInterval(setT);
}
function playedHandler(b) {
    setT = window.setInterval(setFunction, 1000);
}
function pausedHandler(b) {
    if (setT) window.clearInterval(setT);
    if (!b) setT = window.setInterval(setFunction, 1000);
}
function setFunction() {
    watchTime += 1;
    //获取学习时间
    CKobject._K_('studyTime').innerHTML = watchTime;

    //播放时，触发播放事件
    //activeEvent($.trim($('#playTime').text()));
    //提交数据
    //ajax提交在线时间
    var interval = 10;
    if (Number(watchTime) % interval == 0) {
        $.get("/Ajax/StudentStudy.ashx", {
            couid: couid,
            olid: olid,
            studyTime: interval,
            playTime: Number($("#playTime").html().trim()) * 1000,
            totalTime: Number($("#totalTime").html().trim()) * 1000
        });
    }
}
function timeHandler(t) {
    //播放进度
    if (t > -1) {
        CKobject._K_('playTime').innerHTML = Math.floor(Number(t));
        var id = $().getPara('id');
        $.cookie("outlineVideo_" + id, t);
        //
        //获取视频时长
        var dura = CKobject._K_('totalTime').innerHTML;
        if (Number(dura) < 1) {
            var a = CKobject.getObjectById('ckplayer_videobox').getStatus();
            var total = '';
            for (var k in a) {
                if (k == 'totalTime')
                    total = a[k];
            }
            CKobject._K_('totalTime').innerHTML = total;
        }
    }
}

//加载视频播放器
var flashvars = {
    //i:'http://www.ckplayer.com/images/loadimg3.jpg',//初始图片地址   
    e: '0', //视频结束后的动作，0是调用js函数，1是循环播放，2是暂停播放并且不调用广告，3是调用视频推荐列表的插件，4是清除视频流并调用js功能和1差不多，5是暂停播放并且调用暂停广告
    p: '1', //视频默认0是暂停，1是播放，2是不加载视频
    loaded: 'loadedHandler', //当播放器加载完成后发送该js函数loaded
    //调用播放器的所有参数列表结束
    //以下为自定义的播放器参数用来在插件里引用的
    my_url: encodeURIComponent(window.location.href)//本页面地址
    //调用自定义播放器参数结束
};
var params = { bgcolor: '#FFF', allowFullScreen: false, allowScriptAccess: 'always', wmode: 'transparent' }; //这里定义播放器的其它参数如背景色（跟flashvars中的b不同），是否支持全屏，是否支持交互
try {
    var video = [playMp4(videoFile) + '->video/mp4'];
    //alert(video);
    CKobject.embedHTML5('videobox', 'ckplayer_videobox', '100%', '260', video, flashvars, ['all']);
} catch (e) {
}
//播放flv格式的同名mp4视频
function playMp4(vname) {
    var vfile = vname;
    if (!isOuter) {  //如果是外部链接
        //vname = window.BASE64.decoder(vname);
        if (vname.indexOf('.' > -1)) {
            var exist = vname.substring(vname.lastIndexOf('.') + 1);
            if (exist != "aspx") {
                vname = vname.substring(0, vname.lastIndexOf('.'));
                vfile = vname + ".mp4";
            }
        }
        $("#loadvideo").attr("href", vfile);
        $("#loadvideo").attr("download", vfile);
    } else {
        $("#loadvideo").attr("href", vname);
        $("#loadvideo").attr("download", vname);
    }
    return vfile;
}
//跳转到历史学习点
$(function () {
    $(".historyInfo").click(function () {
        var history = $.trim($("#historyTime").text());
        CKobject.getObjectById('ckplayer_videobox').videoSeek(history);
    });
});

