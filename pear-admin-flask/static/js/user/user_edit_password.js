
layui.use(['form', 'jquery', 'popup'], function () {
    let form = layui.form
    let $ = layui.jquery
    let popup = layui.popup

    // 修改密码提交
    form.on('submit(edit-password)', function (data) {
        $.ajax({
            url: editPasswordUrl,
            data: JSON.stringify(data.field),
            contentType: 'application/json',
            dataType: 'json',
            type: 'put',
            success: function (result) {
                if (result.success) {
                    popup.success(result.msg, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))
                    })
                } else {
                    popup.failure(result.msg)
                }
            }
        })
        return false
    })

})
