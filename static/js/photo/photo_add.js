layui.use(['jquery', 'element', 'form', 'upload'], function () {
    var $ = layui.jquery;
    var element = layui.element;
    var form = layui.form;
    var upload = layui.upload;
    //选完文件后不自动上传
    upload.render({
        elem: '#logo-img'
        , url: ADMINFILE_UPLOAD_URL
        , auto: false
        , exts: 'jpg|png|gif|bmp|jpeg'
        , size: 1000
        , bindAction: '#logo-upload-button'
        , done: function (res) {
            if (res.success) {
                layer.msg(res.msg, { icon: 1, time: 500 }, function () {
                    parent.layer.close(parent.layer.getFrameIndex(window.name));//关闭当前页
                    window.parent.location.reload();
                });
            } else {
                layer.msg(res.msg, { icon: 2 });
            }
        }
    });
});
