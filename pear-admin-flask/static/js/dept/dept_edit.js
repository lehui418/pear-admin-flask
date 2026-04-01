layui.use(['form', 'jquery'], function () {
    let form = layui.form
    let $ = layui.jquery

    form.on('submit(dept-update)', function (data) {
        $.ajax({
            url: DEPT_UPDATE_URL,
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'put',
            success: function (result) {
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))//关闭当前页
                        parent.render()
                    })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
