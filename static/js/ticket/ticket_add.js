
                // 使用原生JavaScript实现优先级提示功能
                document.addEventListener('DOMContentLoaded', function() {
                    var tooltip = document.getElementById('priorityTooltip');
                    var tooltipContent = document.getElementById('priorityTooltipContent');
                    
                    // 显示提示框的函数 - 调整为向上显示
                    function showTooltip() {
                        var rect = tooltip.getBoundingClientRect();
                        var bodyRect = document.body.getBoundingClientRect();
                        var tooltipHeight = tooltipContent.offsetHeight;
                         
                        tooltipContent.style.top = (rect.top - bodyRect.top - tooltipHeight - 155) + 'px';  // 进一步增加向上移动的距离           // 向左移动更多距离
                        tooltipContent.style.left = (rect.left - bodyRect.left - 190) + 'px';
                        tooltipContent.style.display = 'block';
                    }
                    
                    // 隐藏提示框的函数
                    function hideTooltip() {
                        tooltipContent.style.display = 'none';
                    }
                    
                    // 鼠标悬停显示提示
                    tooltip.addEventListener('mouseenter', function(e) {
                        e.stopPropagation();
                        showTooltip();
                    });
                    
                    // 鼠标离开隐藏提示
                    tooltip.addEventListener('mouseleave', function() {
                        hideTooltip();
                    });
                    
                    // 点击也可以控制显示/隐藏
                    tooltip.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (tooltipContent.style.display === 'block') {
                            hideTooltip();
                        } else {
                            showTooltip();
                        }
                    });
                    
                    // 点击其他地方关闭提示框
                    document.addEventListener('click', function(e) {
                        if (!tooltip.contains(e.target) && !tooltipContent.contains(e.target)) {
                            hideTooltip();
                        }
                    });
                });

    layui.use(['form', 'layer', 'jquery', 'upload'], function () {
        var form = layui.form,
            layer = layui.layer,
            upload = layui.upload,
            $ = layui.jquery;
        var basePath = '/'; // Adjust if your app is not at the root
        var imageUrls = [];
        
        // 自定义验证规则 - 最小长度
        form.verify({
            minLength: function(value, item) {
                var minLength = parseInt($(item).data('minlength')) || 0;
                if (value.length < minLength) {
                    return '详细描述至少需要输入' + minLength + '个字符';
                }
            }
        });

        // 监听工单状态变化 - 已关闭或已解决时自动设置业务已恢复
        form.on('select(status)', function(data) {
            var status = data.value;
            if (status === '已解决' || status === '已关闭') {
                // 自动勾选业务已恢复
                $('input[name="business_recovered"]').prop('checked', true);
                form.render('checkbox');
            }
        });

        // 监听粘贴事件 - 支持所有三个文本域
        $('textarea[name="description"], textarea[name="relatedinfo"], textarea[name="solution"]').on('paste', function(e) {
            var clipboardData = e.originalEvent.clipboardData;
            var items = clipboardData.items;
            var blob = null;
            
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    blob = items[i].getAsFile();
                    break;
                }
            }
            
            if (blob) {
                // 阻止默认粘贴行为，防止文件名被粘贴到文本框
                e.preventDefault();
                
                var formData = new FormData();
                formData.append('file', blob);
                
                // 显示上传中提示
                var loadIndex = layer.load(1, {
                    shade: [0.1, '#fff']
                });
                
                // 获取当前文本域的名称，用于确定目标容器和隐藏字段
                var targetTextareaName = $(e.target).attr('name');
                var targetImageContainerId = targetTextareaName + '-image-container';
                if (targetTextareaName === 'description') {
                    targetImageContainerId = 'description-image-container';
                } else if (targetTextareaName === 'relatedinfo') {
                    targetImageContainerId = 'related-info-image-container';
                } else if (targetTextareaName === 'solution') {
                    targetImageContainerId = 'solution-image-container';
                }
                
                // 上传图片
                $.ajax({
                    url: basePath + 'system/upload/image',
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(res) {
                        layer.close(loadIndex);
                        if (res.success) {
                            // 添加图片到容器
                            var imgUrl = res.data.url;
                            var photoId = res.data.photo_id;
                            // 存储图片URL和ID
                            imageUrls.push({url: imgUrl, id: photoId});
                            
                            // 使用新的图片获取接口
                            var displayUrl = basePath + 'system/upload/image/' + photoId;
                            
                            $('#' + targetImageContainerId).append(
                                '<div class="pasted-image" style="display:inline-block; position:relative; margin:5px;">' +
                                '<img src="' + displayUrl + '" style="max-width:200px; max-height:200px; border:1px solid #ddd; padding:3px;">' +
                                '<span class="delete-image" data-url="' + imgUrl + '" data-id="' + photoId + '" data-textarea="' + targetTextareaName + '" style="position:absolute; top:0; right:0; background:rgba(0,0,0,0.5); color:#fff; cursor:pointer; padding:2px 5px;">×</span>' +
                                '</div>'
                            );
                            
                            // 更新隐藏字段，添加图片标记（包含ID信息）
                            var hiddenFieldId = 'hidden_image_references_' + targetTextareaName;
                            var imgMark = '![图片](' + imgUrl + '#id=' + photoId + ')';
                            $('#' + hiddenFieldId).val($('#' + hiddenFieldId).val() + imgMark + '\n@@IMAGE_SEPARATOR@@\n');
                        } else {
                            layer.msg('图片上传失败: ' + res.msg, {icon: 2});
                        }
                    },
                    error: function() {
                        layer.close(loadIndex);
                        layer.msg('图片上传失败', {icon: 2});
                    }
                });
            }
        });
        
        // 删除图片 - 支持所有三个文本域
        $(document).on('click', '.delete-image', function() {
            var url = $(this).data('url');
            var photoId = $(this).data('id');
            var targetTextareaName = $(this).data('textarea');
            var imgElement = $(this).parent();
            
            // 从DOM中移除图片
            imgElement.remove();
            
            // 从对应的隐藏图片引用字段中移除图片标记
            var hiddenFieldId = 'hidden_image_references_' + targetTextareaName;
            var hiddenText = $('#' + hiddenFieldId).val();
            if (hiddenText) {
                $('#' + hiddenFieldId).val(hiddenText.replace('![图片](' + url + '#id=' + photoId + ')' + '\n@@IMAGE_SEPARATOR@@\n', ''));
            }
            
            // 从图片URL数组中移除
            var index = -1;
            for (var i = 0; i < imageUrls.length; i++) {
                if (imageUrls[i].id === photoId) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                imageUrls.splice(index, 1);
            }
        });

        // 监听提交
        form.on('submit(saveBtn)', function (data) {
            var $submitBtn = $(this); // Cache the submit button
            // Disable the button to prevent multiple submissions
            $submitBtn.addClass('layui-btn-disabled').attr('disabled', 'disabled');

            var formData = data.field;
            // 添加图片URLs到表单数据 - This might be redundant if backend uses image_references_str primarily
            // formData.imageUrls = JSON.stringify(imageUrls); // Keep for now, or decide if backend solely relies on image_references_str
            // Ensure hidden_image_references is included in formData if not automatically picked up by data.field
            // formData.image_references_str = $('#hidden_image_references').val(); // This should be automatically included by data.field due to the name attribute
            
            $.ajax({
                url: basePath + 'system/ticket/save',
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (res) {
                    if (res.success) {
                        layer.msg(res.msg, {icon: 1, time: 1000}, function () {
                            parent.layer.close(parent.layer.getFrameIndex(window.name)); //关闭当前iframe
                            parent.layui.table.reload('dataTable'); // Reload parent table
                            
                            // 新增成功后自动跳转到详情页面
                            if (res.data && res.data.ticket_id) {
                                var ticketId = res.data.ticket_id;
                                // 延迟跳转，确保表格刷新完成
                                setTimeout(function() {
                                    // 使用父页面的layer打开详情页面
                                    parent.layer.open({
                                        type: 2,
                                        title: '工单详情',
                                        shadeClose: true,
                                        shade: 0.8,
                                        area: ['90%', '90%'],
                                        content: '/system/ticket/view/' + ticketId
                                    });
                                }, 500);
                            }
                        });
                    } else {
                        layer.msg(res.msg, {icon: 2, time: 1500});
                        // Re-enable the button on failure
                        $submitBtn.removeClass('layui-btn-disabled').removeAttr('disabled');
                    }
                },
                error: function (xhr, status, error) {
                    layer.msg('请求失败: ' + error, {icon: 2, time: 1500});
                    // Re-enable the button on error
                    $submitBtn.removeClass('layui-btn-disabled').removeAttr('disabled');
                }
            });
            return false; //阻止表单跳转。如果需要表单跳转，去掉这段即可。
        });
    });
