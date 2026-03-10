
  var basePath = '/'; // Adjust if your app is not at the root
  layui.use(['table', 'form', 'jquery', 'laydate'], function () {
    let table = layui.table
    let form = layui.form
    let $ = layui.jquery
    let laydate = layui.laydate
    
    // 搜索区域展开/收起功能
    $('#toggleSearch').on('click', function() {
      let searchArea = $('#searchArea');
      if (searchArea.is(':visible')) {
        searchArea.slideUp();
        $(this).html('<i class="layui-icon layui-icon-down"></i> 展开搜索');
      } else {
        searchArea.slideDown();
        $(this).html('<i class="layui-icon layui-icon-up"></i> 收起搜索');
      }
    });
    let cols = [
      [
        {
          type: 'checkbox'
        },
        {
          field: 'id',
          title: '工单ID',
          sort: true,
          align: 'center',
          unresize: false, // Changed from true to false to allow resizing
          width: 100 // 减小宽度以节省空间
        },
        {
          field: 'title', // Changed from 'name'
          title: '工单标题', // Changed from '文件名称'
          sort: true,
          unresize: false,
          align: 'left', // 调整为左对齐
          width: 240 // 调整宽度，再增加10
        },
        {
          field: 'serial_number',
          title: '序列号',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          width: 165, // 调整宽度，再增加10
          hide: false
        },
        {
          field: 'priority', // Changed from 'href'
          title: '优先级',    // Changed from '图片'
          sort: true,
          unresize: false,
          align: 'center',
          width: 88, // 增加宽度
          templet: function(d) {
            if (d.priority === 'P1' || d.priority === 'High') return '<span class="layui-badge layui-bg-red">P1 重大</span>';
            if (d.priority === 'P2' ) return '<span class="layui-badge layui-bg-orange">P2 主要</span>';
            if (d.priority === 'P3' || d.priority === 'Medium') return '<span class="layui-badge layui-bg-blue">P3 次要</span>';
            if (d.priority === 'P4' || d.priority === 'Low') return '<span class="layui-badge layui-bg-green">P4 咨询</span>';
            return d.priority || '';
          }
        },
        {
          field: 'status', // Changed from 'mime'
          title: '工单状态', // Changed from 'mime类型'
          sort: true,
          unresize: false,
          align: 'center',
          width: 160, // 调整宽度
          templet: function(d) {
            let statusText = '';
            let statusDisplay = d.status_display || d.status; // Use status_display if available, otherwise fallback to status
            // Apply color based on status
            if (d.status === '创建/提交') statusText = '<span style="color: #4A90E2; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '未完成-客户原因') statusText = '<span style="color: #FFD700; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '未完成-研发原因') statusText = '<span style="color: #FFA500; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '未完成-生产原因') statusText = '<span style="color: #9B59B6; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '未完成-售后原因') statusText = '<span style="color: #FF6B6B; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '暂时规避') statusText = '<span style="color: #2ECC71; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '处理中') statusText = '<span style="color: #E74C3C; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '已解决') statusText = '<span style="color: #27AE60; font-weight: bold;">' + statusDisplay + '</span>';
            else if (d.status === '已关闭') statusText = '<span style="color: #95A5A6; font-weight: bold;">' + statusDisplay + '</span>';

            else statusText = '<span class="layui-badge">' + statusDisplay + '</span>'; // Default for any other status

            if (d.is_overdue === true) {
                statusText += ' <span class="layui-badge layui-bg-red" title="工单已超时">已超时</span>';
            }
            return statusText;
          }
        },
        {
          field: 'assignee_name',
          title: '负责人',
          sort: true,
          unresize: false,
          align: 'center',
          width: 100 // 增加宽度
        },
        {
          field: 'description',
          title: '详细记录',
          sort: true,
          unresize: false,
          align: 'center',
          width: 100, // 增加宽度
          hide: true
        },
        {
          field: 'service_method',
          title: '服务方式',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'engineer_id',
          title: '工程师工号',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'product_type_level1',
          title: '产品一级分类',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'product_type_level2',
          title: '产品二级分类',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'version_number',
          title: '版本号',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
       {
          field: 'is_out_of_warranty',
          title: '是否过保',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true,
          templet: function(d) {
            return d.is_out_of_warranty ? 'true' : 'false';
          } 
        },
        {
          field: 'problem_classification_main',
          title: '问题主分类',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'problem_classification_sub',
          title: '处理记录',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'create_time',
          title: '创建时间',
          templet: '#file-uploadTime', // This templet can be reused
          sort: true,
          unresize: false,
          align: 'center',
          width: 160 // 调整宽度
        },
        {
          field: 'update_time',
          title: '更新时间',
          templet: function(d) {
            return d.update_time ? layui.util.toDateString(d.update_time, "yyyy-MM-dd HH:mm:ss") : '';
          },
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          width: 160 // 调整宽度
        },
        {
          field: 'order_time',
          title: '接单时间',
          templet: function(d) {
            return d.order_time ? layui.util.toDateString(d.order_time, "yyyy-MM-dd HH:mm:ss") : '';
          },
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true // 新增：隐藏该列
        },
        {
          field: 'completion_time',
          title: '完成时间',
          templet: function(d) {
            return d.completion_time ? layui.util.toDateString(d.completion_time, "yyyy-MM-dd HH:mm:ss") : '';
          },
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          width: 160 // 调整宽度
        },
        {
          field: 'status_description',
          title: '状态描述',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true // Default to hidden, can be shown by user
        },
        {
          field: 'fault_description',
          title: '需求/故障描述',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true // Default to hidden
        },
        {
          field: 'solution',
          title: '处置方案',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true // Default to hidden
        },
        {
          field: 'customer_agent_name',
          title: '客户/问题信息',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true // Default to hidden
        },
        {
          field: 'impact_scope',  // 新增的影响范围列
          title: '影响范围',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true  // 默认隐藏，需要时可通过表头菜单显示
        },
        // The following duplicate/misplaced column definitions are being removed.problem_classification_tags
        // problem_classification_tags and appointment_time will be re-added correctly if they were intended.
        {
          field: 'problem_tags',
          title: '问题标签',
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          field: 'appointment_time',
          title: '预约时间',
          templet: function(d) {
            return d.appointment_time ? layui.util.toDateString(d.appointment_time, "yyyy-MM-dd HH:mm:ss") : '';
          },
          sort: true, // 添加排序
          unresize: false,
          align: 'center',
          hide: true
        },
        {
          title: '操作',
          toolbar: '#user-bar',
          align: 'center',
          unresize: false, // 改为false允许用户调整列宽
          width: 180 // 调整宽度，减少20
        }
      ]
    ]

    table.render({
      elem: '#dataTable',
      url: basePath + 'system/ticket/table', // Changed URL to fetch ticket data
      page: true,
      cols: cols,
      skin: 'line',
      toolbar: '#toolbar',
      defaultToolbar: [{
        layEvent: 'refresh',
        icon: 'layui-icon-refresh',
      }, {
        layEvent: 'toggleSearch',
        icon: 'layui-icon-search',
        title: '显示/隐藏筛选区域'
      }, 'filter', 'print', 'exports'],
      height: 'full-120', // 设置表格高度，自适应页面
      even: true, // 开启隔行背景
      cellMinWidth: 80, // 设置单元格最小宽度
      limit: 15, // 每页显示的条数
      limits: [15, 30, 50, 100], // 每页条数的选择项
      text: { none: '暂无相关数据' } // 无数据时显示的文本
    })

    // 表格行工具条事件
    table.on('tool(dataTable)', function (obj) {
      // 使用HTML中定义的变量
      var currentUsername = CURRENT_USERNAME;
      
      if (obj.event === 'remove') {
        // 允许管理员、工单创建者或负责人删除工单
        // 统一转换为字符串进行比较，避免类型不匹配
        if (HAS_DELETE_PERMISSION && (IS_ADMIN || 
            (obj.data.user_id && String(obj.data.user_id) == String(CURRENT_USER_ID)) || 
            (obj.data.assignee_name && obj.data.assignee_name == currentUsername))) {
          window.remove(obj);
        } else {
          layer.msg('您没有权限删除此工单', {icon: 2});
        }
      } else if (obj.event === 'edit') {
        // 允许管理员、工单创建者、负责人或研发人员（针对未完成-研发原因工单）或质量部人员（针对未完成-生产原因或特定问题分类）编辑工单
        var problemClass = obj.data.problem_classification_main || '';
        var hasQualityEditPermission = IS_QUALITY_MEMBER && (obj.data.status == '未完成-生产原因' || 
            (problemClass && (problemClass.indexOf('软件bug-需寄回升级包') > -1 || problemClass.indexOf('硬件') > -1)));
        // 统一转换为字符串进行比较，避免类型不匹配
        if (HAS_EDIT_PERMISSION && (IS_ADMIN || 
            (obj.data.user_id && String(obj.data.user_id) == String(CURRENT_USER_ID)) || 
            (obj.data.assignee_name && obj.data.assignee_name == currentUsername) ||
            (IS_RD_MEMBER && obj.data.status == '未完成-研发原因') ||
            hasQualityEditPermission)) {
          window.edit(obj);
        } else {
          layer.msg('您没有权限编辑此工单', {icon: 2});
        }
      } else if (obj.event === 'view') {
        window.view(obj);
      }
    })
    


    table.on('toolbar(dataTable)', function (obj) {
      if (obj.event === 'add') {
        window.add()
      } else if (obj.event === 'exportAll') {
        window.exportAll()
      } else if (obj.event === 'refresh') {
        window.refresh()
      } else if (obj.event === 'batchRemove') {
        window.batchRemove(obj)
      } else if (obj.event === 'toggleSearch') {
        // 显示/隐藏筛选区域
        $('.layui-form.layui-form-pane').slideToggle('fast');
      }
    })

    //弹出窗设置 自己设置弹出百分比
    function screen () {
      if (typeof width !== 'number' || width === 0) {
        width = $(window).width() * 0.8
      }
      if (typeof height !== 'number' || height === 0) {
        height = $(window).height() - 20
      }
      return [width + 'px', height + 'px']
    }

    window.add = function () {
      layer.open({
        type: 2,
        maxmin: true,
        title: '新增工单',
        shade: 0.1,
      area: ['600px', '500px'], // Adjusted for ticket form
      content: basePath + 'system/ticket/add'
    });
    }

    window.exportAll = function () {
      layer.confirm('确定要导出所有工单数据吗？', {
        icon: 3,
        title: '提示'
      }, function (index) {
        layer.close(index);
        var loadingIndex = layer.load(1, {shade: [0.3, '#000']});
        
        var exportUrl = basePath + 'system/ticket/export';
        
        var searchParams = {
          keyword: $('#searchKeyword').val(),
          status: $('#searchStatus').val(),
          priority: $('#searchPriority').val(),
          assignee: $('#searchAssignee').val(),
          service_method: $('#searchServiceMethod').val(),
          product_type: $('#searchProductType').val(),
          engineer_id: $('#searchEngineerId').val(),
          serial_number: $('#searchSerialNumber').val(),
          version_number: $('#searchVersionNumber').val(),
          problem_main: $('#searchProblemMain').val(),
          relatedinfo: $('#relatedinfo').val(),
          warranty: $('#searchWarranty').val(),
          security_level: $('#searchSecurityLevel').val(),
          threat_type: $('#searchThreatType').val(),
          impact_scope: $('#searchImpactScope').val(),
          description: $('#description').val(),
          product_type_level1: $('#product_type_level1').val(),
          product_type_level2: $('#product_type_level2').val(),
          customer_agent_name: $('#customer_agent_name').val(),
          problem_classification_main: $('#problem_classification_main').val(),
          problem_tags: $('#problem_tags').val(),
          solution: $('#solution').val(),
          order_time: $('#order_time').val(),
          create_time: $('#create_time').val()
        };
        
        var queryString = $.param(searchParams);
        var fullUrl = exportUrl + '?' + queryString;
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', fullUrl, true);
        xhr.responseType = 'blob';
        xhr.timeout = 300000;
        
        xhr.onload = function() {
          layer.close(loadingIndex);
          if (xhr.status === 200) {
            var filename = 'tickets_export.csv';
            var disposition = xhr.getResponseHeader('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
              var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
              var matches = filenameRegex.exec(disposition);
              if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
              }
            }
            
            var blob = new Blob([xhr.response], {type: 'text/csv;charset=utf-8'});
            var link = document.createElement('a');
            if (link.download !== undefined) {
              var url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', filename);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
            layer.msg('导出成功', {icon: 1, time: 2000});
          } else {
            layer.msg('导出失败: HTTP ' + xhr.status, {icon: 2, time: 3000});
          }
        };
        
        xhr.ontimeout = function() {
          layer.close(loadingIndex);
          layer.msg('导出超时，请减少筛选条件后重试', {icon: 2, time: 3000});
        };
        
        xhr.onerror = function() {
          layer.close(loadingIndex);
          layer.msg('导出失败，请稍后重试', {icon: 2, time: 3000});
        };
        
        xhr.send();
      });
    }

    // 查看工单详情函数
    window.view = function (obj) {
      var index = layer.open({
        type: 2,
        maxmin: true,
        title: '查看工单 - ' + (obj.data.title || obj.data.id),
        shade: 0.1,
        area: screen(),
        content: basePath + 'system/ticket/view/' + obj.data.id // 查看工单详情的URL
      });
      // 默认最大化
      layer.full(index);
    }

    // New window.edit function
    window.edit = function (obj) {
      // 检查当前用户是否为负责人
      var isAssignee = obj.data.assignee_name && obj.data.assignee_name == CURRENT_USERNAME;
      var editUrl = basePath + 'system/ticket/edit/' + obj.data.id;
      
      // 如果是负责人，添加查询参数
      if (isAssignee) {
        editUrl += '?is_assignee=true';
      }
      
      var index = layer.open({
        type: 2,
        maxmin: true,
        title: '编辑工单 - ' + (obj.data.title || obj.data.id),
        shade: 0.1,
        area: screen(),
        content: editUrl // Changed content URL for editing a ticket
      });
      // 默认最大化
      layer.full(index);
    }

    window.remove = function (obj) {
      layer.confirm('确定要删除工单：【' + (obj.data.title || obj.data.id) + '】？', { // Changed confirmation message
        icon: 3,
        title: '提示'
      }, function (index) {
        layer.close(index)
        let loading = layer.load()
        
        // 检查当前用户是否为负责人
        var isAssignee = obj.data.assignee_name && obj.data.assignee_name == CURRENT_USERNAME;
        
        $.ajax({
          url: basePath + 'system/ticket/delete', // Changed URL for deleting a ticket
          data: { 
            id: obj.data['id'],
            is_assignee: isAssignee // 添加参数，指示是否为负责人
          },
          dataType: 'json',
          type: 'POST', // Consider using 'DELETE' method if backend supports
          success: function (res) {
            layer.close(loading)
            if (res.success) {
              layer.msg(res.msg, {
                icon: 1,
                time: 1000
              }, function () {
                obj.del()
              })
            } else {
              layer.msg(res.msg, {
                icon: 2,
                time: 1000
              })
            }
          }
        })
      })
    }

    window.batchRemove = function (obj) {
      let data = table.checkStatus(obj.config.id).data
      if (data.length === 0) {
        layer.msg('未选中数据', {
          icon: 3,
          time: 1000
        })
        return false
      }
      var ids = []
      var hasCheck = table.checkStatus('dataTable')
      var hasCheckData = hasCheck.data
      if (hasCheckData.length > 0) {
        $.each(hasCheckData, function (index, element) {
          ids.push(element.id)
        })
      }
      layer.confirm('确定要批量删除选中的 ' + ids.length + ' 条工单吗？', { // Changed confirmation message
        icon: 3,
        title: '提示'
      }, function (index) {
        layer.close(index)
        let loading = layer.load()
        $.ajax({
          url: basePath + 'system/ticket/batchDelete', // Changed URL for batch deleting tickets
          data: { 'ids[]': ids },
          dataType: 'json',
          type: 'POST', // Consider using 'DELETE' method
          traditional: true, // For sending array correctly
          success: function (res) {
            layer.close(loading)
            if (res.success) {
              layer.msg(res.msg, {
                icon: 1,
                time: 1000
              }, function () {
                table.reload('dataTable')
              })
            } else {
              layer.msg(res.msg, {
                icon: 2,
                time: 1000
              })
            }
          }
        })
      })
    }

    window.refresh = function () {
      // 重置搜索表单
      $('#searchKeyword').val('');
      $('#searchStatus').val('');
      $('#searchPriority').val('');
      $('#searchAssignee').val('');
      $('#searchServiceMethod').val('');
      $('#searchProductType').val('');
      $('#searchEngineerId').val('');
      $('#searchSerialNumber').val('');
      $('#searchVersionNumber').val('');
      $('#searchProblemMain').val('');
      $('#relatedinfo').val('');
      $('#searchWarranty').val('');
      $('#searchSecurityLevel').val('');
      $('#searchThreatType').val('');
      $('#searchImpactScope').val('');
      $('#description').val('');
      $('#product_type_level1').val('');
      $('#product_type_level2').val('');
      $('#customer_agent_name').val('');
      $('#impact_scope').val('');
      $('#problem_classification_main').val('');
      $('#problem_tags').val('');
      $('#solution').val('');
      $('#order_time').val('');
      $('#create_time').val('');
      form.render('select');
      
      // 重新加载表格数据
      table.reload('dataTable', {
        where: {}
      });
    }
    // 查看大图
    window.photo = function (obj) {
      if (!obj.data.href || obj.data.href === '') {
        layer.msg('图片地址错误！')
        return
      }
      var auto_img = {}
      var img = new Image()
      img.src = obj.data.href
      img.onload = function () {
        var max_height = $(window).height() - 100
        var max_width = $(window).width()
        var rate1 = max_height / img.height
        var rate2 = max_width / img.width
        var rate3 = 1
        var rate = Math.min(rate1, rate2, rate3)
        auto_img.height = img.height * rate
        auto_img.width = img.width * rate
        layer.open({
          type: 1,
          title: false,
          area: ['auto'],
          skin: 'layui-layer-nobg', //没有背景色
          shadeClose: true,
          content: '<img src=\'' + obj.data['href'] + '\' width=\'' + auto_img.width + 'px\' height=\'' + auto_img.height + 'px\'>'
        })
      }
    }

    // 搜索功能
    $('#searchBtn').on('click', function() {
      var keyword = $('#searchKeyword').val();
      var status = $('#searchStatus').val();
      var priority = $('#searchPriority').val();
      var assignee = $('#searchAssignee').val();
      var service_method = $('#searchServiceMethod').val();
      var product_type = $('#searchProductType').val();
      var engineer_id = $('#searchEngineerId').val();
      var serial_number = $('#searchSerialNumber').val();
      var version_number = $('#searchVersionNumber').val();
      var problem_main = $('#serial_number').val();
      var relatedinfo = $('#relatedinfo').val();
      var warranty = $('#searchWarranty').val();
      var security_level = $('#searchSecurityLevel').val();
      var threat_type = $('#searchThreatType').val();
      var impact_scope = $('#searchImpactScope').val();
      var description = $('#description').val();
      var product_type_level1 = $('#product_type_level1').val();
      var product_type_level2 = $('#product_type_level2').val();
      var customer_agent_name = $('#customer_agent_name').val();
      var problem_classification_main = $('#problem_classification_main').val();
      var problem_tags = $('#problem_tags').val();
      var solution = $('#solution').val();
      var order_time = $('#order_time').val();
      var create_time = $('#create_time').val();
      
      // 执行搜索重载
      table.reload('dataTable', {
        page: {
          curr: 1 // 重新从第 1 页开始
        },
        where: {
          keyword: keyword,
          status: status,
          priority: priority,
          assignee: assignee,
          service_method: service_method,
          product_type: product_type,
          engineer_id: engineer_id,
          serial_number: serial_number,
          version_number: version_number,
          problem_main: problem_main,
          relatedinfo: relatedinfo,
          warranty: warranty,
          security_level: security_level,
          threat_type: threat_type,
          impact_scope: impact_scope,
          description: description,
          product_type_level1: product_type_level1,
          product_type_level2: product_type_level2,
          customer_agent_name: customer_agent_name,
          problem_classification_main: problem_classification_main,
          problem_tags: problem_tags,
          solution: solution,
          order_time: order_time,
          create_time: create_time,
        }
      });
    });
    
    
    // 重置按钮事件
    $('#resetBtn').on('click', function() {
      $('#searchKeyword').val('');
      $('#searchStatus').val('');
      $('#searchPriority').val('');
      $('#searchAssignee').val('');
      $('#searchServiceMethod').val('');
      $('#searchProductType').val('');
      $('#searchEngineerId').val('');
      $('#searchSerialNumber').val('');
      $('#searchVersionNumber').val('');
      $('#searchProblemMain').val('');
      $('#relatedinfo').val('');
      $('#searchWarranty').val('');
      $('#searchSecurityLevel').val('');
      $('#searchThreatType').val('');
      $('#searchImpactScope').val('');
      $('#description').val('');
      $('#product_type_level1').val('');
      $('#product_type_level2').val('');
      $('#customer_agent_name').val('');
      $('#impact_scope').val('');
      $('#problem_classification_main').val('');
      $('#problem_tags').val('');
      $('#solution').val('');
      $('#order_time').val('');
      $('#create_time').val('');
      form.render('select');
      
      // 重新加载表格数据
      table.reload('dataTable', {
        where: {}
      });
    });
  })
