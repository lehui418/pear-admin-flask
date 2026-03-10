layui.use(['form', 'jquery', 'iconPicker', 'dtree'], function () {
    let form = layui.form
    let $ = layui.jquery
    let icon = layui.iconPicker
    let dtree = layui.dtree

    dtree.renderSelect({
        elem: '#selectParent',
        url: POWER_SELECT_PARENT_URL,
        method: 'get',
        selectInputName: { nodeId: 'parentId', context: 'powerName' },
        skin: 'layui',
        dataFormat: 'list',
        response: { treeId: 'powerId', parentId: 'parentId', title: 'powerName' },  //修改response中返回数据的定义
        selectInitVal: '0'
    })

    form.on('radio(powerType)', function () {
        if (this.value == '0') {
            $('#powerUrlItem').hide()
            $('#powerCodeItem').hide()
            $('#openTypeItem').hide()
            $('#powerUrl').val('')
            $('#powerCode').val('')
            $('#openType').val('')
        } else if (this.value == '1') {
            $('#powerUrlItem').show()
            $('#powerCodeItem').show()
            $('#openTypeItem').show()
        } else if (this.value == '2') {
            $('#powerUrlItem').hide()
            $('#openTypeItem').hide()
            $('#powerCodeItem').show()
            $('#powerUrl').val('')
            $('#openType').val('')
        }
    })

    form.on('submit(power-save)', function (data) {
        data.field.icon = 'layui-icon ' + data.field.icon
        $.ajax({
            url: POWER_SAVE_URL,
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'post',
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


    icon.render({
        elem: '#icon',
        type: 'fontClass',
        search: true,
        click: function (data) {
            console.log(data);
        }
    });
})
