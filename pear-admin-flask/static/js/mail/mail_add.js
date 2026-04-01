layui.use(['form', 'jquery'], function () {
    let form = layui.form
    let $ = layui.jquery
    form.on('submit(mail-save)', function (data) {
        let loading = layer.load()
        $.ajax({
            url: '/system/mail/save',
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'post',
            success: function (result) {
                layer.close(loading)
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))//关闭当前页
                        parent.layui.table.reload('mail-table')
                    })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
