layui.use(['element', 'jquery', 'layer', 'form'], function () {
    let $ = layui.jquery
    let layer = layui.layer
    let form = layui.form
    // 修改密码页面
    $('.edit-password').click(function () {
        layer.open({
            type: 2,
            title: '修改密码',
            shade: 0.1,
            area: ['550px', '280px'],
            content: editPasswordUrl
        })
        return false
    })

    // 修改头像
    $('#avatar').click(function () {
        layer.open({
            type: 2,
            title: '更换图片',
            shade: 0.1,
            area: ['900px', '500px'],
            content: profileUrl,
            btn: ['确定', '取消'],
            yes: function (index, layero) {
                window['layui-layer-iframe' + index].submitForm()
            }
        })
    })

    // 表单提交更改个人信息数据
    form.on('submit(user-update)', function (data) {
        $.ajax({
            url: updateInfoUrl,
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'put',
            success: function (result) {
                if (result.success) {
                    layer.msg('修改成功', { icon: 1, time: 1000 })
                } else {
                    layer.msg('修改失败', { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
