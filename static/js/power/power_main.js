layui.use(['form', 'jquery', 'treeTable', 'popup'], function () {
    let form = layui.form
    let $ = layui.jquery
    let treeTable = layui.treeTable
    let popup = layui.popup

    let MODULE_PATH = '/system/power/'

    window.render = function () {
        treeTable.render({
            skin: 'line',
            method: 'post',
            treeDefaultClose: true,
            toolbar: '#power-toolbar',
            elem: '#power-table',
            url: MODULE_PATH + 'data',
            page: false,
            cols: [
                [
                    { type: 'checkbox', fixed: 'left' },
                    { field: 'id', width: 100, title: '编号' },
                    { field: 'name', title: '权限名称' },
                    { field: 'icon', title: '图标', templet: '#icon' },
                    { field: 'type', title: '权限类型', templet: '#power-type' },
                    { field: 'enable', title: '是否可用', templet: '#power-enable' },
                    { field: 'sort', title: '排序' },
                    { title: '操作', templet: '#power-bar', width: 150, align: 'center' }
                ]
            ]
        })
    }

    render()

    form.on('submit(power-query)', function (data) {
        var keyword = data.field.powerName;

        if (!keyword) {
            layer.msg('搜索内容为空', {
                icon: 3,
                time: 1000
            })
            return false;
        }

        treeTable.checkAllNodes('power-table', false);

        var expandNotes = [];

        treeTable.getNodesByFilter('power-table', function (item) {
            if (item.name.indexOf(keyword) !== -1) {
                treeTable.setRowChecked('power-table', { index: item, checked: true });

                // 遍历其全部父元素
                var parent_id = item.parent_id;

                while (parent_id !== 0) {

                    if (!expandNotes.includes(parent_id)) {
                        expandNotes.push(item.LAY_DATA_INDEX);
                    }

                    item = treeTable.getNodeById('power-table', item.parent_id).data;
                    parent_id = item.parent_id;
                }


                if (!expandNotes.includes(parent_id)) {
                    expandNotes.push(item.LAY_DATA_INDEX);
                }

                return true;
            }


        })

        treeTable.expandAll('power-table', false);

        expandNotes.forEach(function (note_id) {
            treeTable.expandNode('power-table', {
                index: note_id,
                expandFlag: true
            });
        })

        return false;
    })

    treeTable.on('tool(power-table)', function (obj) {
        if (obj.event === 'remove') {
            window.remove(obj)
        } else if (obj.event === 'edit') {
            window.edit(obj)
        }
    })

    treeTable.on('toolbar(power-table)', function (obj) {
        if (obj.event === 'add') {
            window.add()
        } else if (obj.event === 'refresh') {
            window.refresh()
        } else if (obj.event === 'batchRemove') {
            window.batchRemove(obj)
        }
    })

    form.on('switch(power-enable)', function (obj) {
        let operate
        if (obj.elem.checked) {
            operate = 'enable'
        } else {
            operate = 'disable'
        }
        let loading = layer.load()
        $.ajax({
            url: MODULE_PATH + '/' + operate,
            data: JSON.stringify({ powerId: this.value }),
            dataType: 'json',
            contentType: 'application/json',
            type: 'put',
            success: function (result) {
                layer.close(loading)
                if (result.success) {
                    popup.success(result.msg)
                } else {
                    popup.failure(result.msg)
                }
            }
        })
    })

    window.add = function () {
        layer.open({
            type: 2,
            title: '新增',
            shade: 0.1,
            area: ['450px', '500px'],
            content: MODULE_PATH + 'add'
        })
    }

    window.edit = function (obj) {
        layer.open({
            type: 2,
            title: '修改',
            shade: 0.1,
            area: ['450px', '500px'],
            content: MODULE_PATH + 'edit/' + obj.data['id']
        })
    }

    window.remove = function (obj) {
        layer.confirm('确定要删除该权限', { icon: 3, title: '提示' }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: MODULE_PATH + 'remove/' + obj.data['id'],
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            treeTable.removeNode('power-table', obj.data.LAY_DATA_INDEX)
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

    window.batchRemove = function (obj) {
        let data = treeTable.checkStatus(obj.config.id).data
        if (data.length === 0) {
            layer.msg('未选中数据', {
                icon: 3,
                time: 1000
            })
            return false
        }
        var ids = []
        var hasCheck = treeTable.checkStatus('power-table')
        var hasCheckData = hasCheck.data
        if (hasCheckData.length > 0) {
            $.each(hasCheckData, function (index, element) {
                ids.push(element.id)
            })
        }
        layer.confirm('确定要删除选中权限', {
            icon: 3,
            title: '提示'
        }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: MODULE_PATH + 'batchRemove',
                data: { ids: ids },
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            treeTable.reload('power-table');
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }
})
