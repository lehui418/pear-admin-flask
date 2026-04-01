layui.use(['table', 'form', 'jquery', 'popup'], function () {
    let table = layui.table
    let form = layui.form
    let $ = layui.jquery
    let popup = layui.popup

    let typeCode

    // URL 配置 - 直接使用 HTML 中定义的变量

    let cols = [
        [
            { type: 'checkbox' },
            { title: '字典名称', field: 'typeName', align: 'center', width: 120 },
            { title: '描述', field: 'description', align: 'center' },
            { title: '字典状态', field: 'enable', align: 'center', templet: '#dict-type-enable', width: 100 },
            { title: '操作', toolbar: '#dict-type-bar', align: 'center', width: 250 }
        ]
    ]

    let dataCols = [
        [
            { type: 'checkbox' },
            { title: '标签', field: 'dataLabel', align: 'center', width: 120 },
            { title: '对应值', field: 'dataValue', align: 'center' },
            { title: '状态', field: 'enable', align: 'center', templet: '#dict-data-enable' },
            { title: '操作', toolbar: '#dict-data-bar', align: 'center', width: 180 }
        ]
    ]

    table.render({
        elem: '#dict-type-table',
        url: DICT_TYPE_DATA_URL,
        page: true,
        cols: cols,
        skin: 'line',
        height: 'full-148',
        toolbar: '#dict-type-toolbar',
        defaultToolbar: [{
            layEvent: 'refresh',
            icon: 'layui-icon-refresh',
        }, 'filter', 'print', 'exports']
    })

    window.renderData = function (code) {
        typeCode = code
        $('.empty').hide()
        table.render({
            elem: '#dict-data-table',
            url: DICT_DATA_DATA_URL + '?typeCode=' + typeCode,
            page: true,
            height: 'full-148',
            cols: dataCols,
            skin: 'line',
            toolbar: '#dict-data-toolbar'
        })
    }

    table.on('tool(dict-type-table)', function (obj) {
        if (obj.event === 'remove') {
            window.removeType(obj)
        } else if (obj.event === 'edit') {
            window.editType(obj)
        } else if (obj.event === 'details') {
            window.renderData(obj.data['typeCode'])
        }
    })

    table.on('toolbar(dict-type-table)', function (obj) {
        if (obj.event === 'add') {
            window.addType()
        } else if (obj.event === 'refresh') {
            window.refreshType()
        } else if (obj.event === 'batchRemove') {
            window.batchRemoveDictType(obj)
        }
    })

    form.on('submit(dict-type-query)', function (data) {
        table.reload('dict-type-table', { where: data.field })
        return false
    })

    form.on('switch(dict-type-enable)', function (obj) {
        let operate
        if (obj.elem.checked) {
            operate = 'enable'
        } else {
            operate = 'disable'
        }
        let loading = layer.load()
        $.ajax({
            url: '/system/dict/dictType/' + operate,
            data: JSON.stringify({ id: this.value }),
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

    window.addType = function () {
        layer.open({
            type: 2,
            title: '新增',
            shade: 0.1,
            area: ['500px', '400px'],
            content: DICT_TYPE_ADD_URL
        })
    }

    window.editType = function (obj) {
        layer.open({
            type: 2,
            title: '修改',
            shade: 0.1,
            area: ['500px', '400px'],
            content: DICT_TYPE_EDIT_URL + '?dictTypeId=' + obj.data['id']
        })
    }

    window.removeType = function (obj) {
        layer.confirm('确定要删除该字典分类？字典值会一并删除！', { icon: 3, title: '提示' }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: '/system/dict/dictType/remove/' + obj.data['id'],
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            if (typeCode === obj.data['typeCode']) {
                                $('div[lay-table-id="dict-data-table"]').remove()
                                $('.empty').show()
                            }
                            obj.del()
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

    window.refreshType = function () {
        table.reload('dict-type-table')
    }

    window.addData = function () {
        layer.open({
            type: 2,
            title: '新增',
            shade: 0.1,
            area: ['500px', '450px'],
            content: DICT_DATA_ADD_URL + '?typeCode=' + typeCode
        })
    }

    window.editData = function (obj) {
        layer.open({
            type: 2,
            title: '修改',
            shade: 0.1,
            area: ['500px', '450px'],
            content: DICT_DATA_EDIT_URL + '?dataId=' + obj.data['dataId']
        })
    }

    window.removeData = function (obj) {
        layer.confirm('确定要删除该字典值？', { icon: 3, title: '提示' }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: '/system/dict/dictData/remove/' + obj.data['dataId'],
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            obj.del()
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

    table.on('tool(dict-data-table)', function (obj) {
        if (obj.event === 'remove') {
            window.removeData(obj)
        } else if (obj.event === 'edit') {
            window.editData(obj)
        } else if (obj.event === 'details') {
            window.details(obj)
        }
    })

    table.on('toolbar(dict-data-table)', function (obj) {
        if (obj.event === 'add') {
            window.addData()
        } else if (obj.event === 'refresh') {
            window.refreshData()
        } else if (obj.event === 'batchRemove') {
            window.batchRemoveDictData(obj)
        }
    })

    form.on('submit(dict-data-query)', function (data) {
        data.field.typeCode = typeCode
        table.reload('dict-data-table', { where: data.field })
        return false
    })

    form.on('switch(dict-data-enable)', function (obj) {
        let operate
        if (obj.elem.checked) {
            operate = 'enable'
        } else {
            operate = 'disable'
        }
        let loading = layer.load()
        $.ajax({
            url: '/system/dict/dictData/' + operate,
            data: JSON.stringify({ dataId: this.value }),
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

    window.refreshData = function () {
        table.reload('dict-data-table')
    }

    window.batchRemoveDictType = function (obj) {
        let data = table.checkStatus(obj.config.id).data
        if (data.length === 0) {
            layer.msg('未选中数据', {
                icon: 3,
                time: 1000
            })
            return false
        }

        var ids = []
        var hasCheck = table.checkStatus('dict-type-table')
        var hasCheckData = hasCheck.data
        if (hasCheckData.length > 0) {
            $.each(hasCheckData, function (index, element) {
                ids.push(element.id)
            })
        }
        layer.confirm('确定要删除选中权限？', {
            icon: 3,
            title: '提示'
        }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: '/system/dict/dictType/batchRemove',
                data: { ids: ids },
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            table.reload('dict-type-table');
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

    window.batchRemoveDictData = function (obj) {
        let data = table.checkStatus(obj.config.id).data
        if (data.length === 0) {
            layer.msg('未选中数据', {
                icon: 3,
                time: 1000
            })
            return false
        }

        var ids = []
        var hasCheck = table.checkStatus('dict-data-table')
        var hasCheckData = hasCheck.data
        if (hasCheckData.length > 0) {
            $.each(hasCheckData, function (index, element) {
                ids.push(element.dataId)
            })
        }

        layer.confirm('确定要删除选中权限？', {
            icon: 3,
            title: '提示'
        }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: '/system/dict/dictData/batchRemove',
                data: { ids: ids },
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            table.reload('dict-data-table');
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

})
