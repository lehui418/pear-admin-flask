layui.use(['form', 'jquery'], function () {
    let form = layui.form
    let $ = layui.jquery

    form.on('submit(dict-data-save)', function (data) {
        $.ajax({
            url: DICT_DICTDATA_UPDATE,
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'put',
            success: function (result) {
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))//关闭当前页
                        parent.layui.table.reload('dict-data-table')
                    })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
