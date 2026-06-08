# Route Permission Matrix

> Auto-generated for pre-release authorization audit.

| File | Line | Function | Method | Route Expr | login_required | authorize |
|---|---:|---|---|---|---|---|
| `applications/view/api/notification.py` | 15 | `get_notifications` | `GET` | `'/list', methods=['GET']` | `Yes` | `system:ticket:main` |
| `applications/view/api/notification.py` | 31 | `send_notification` | `POST` | `'/send', methods=['POST']` | `Yes` | `system:ticket:edit` |
| `applications/view/api/notification.py` | 80 | `mark_as_read` | `POST` | `'/read/<int:notification_id>', methods=['POST']` | `Yes` | `system:ticket:main` |
| `applications/view/api/notification.py` | 95 | `clear_notifications` | `POST` | `'/clear', methods=['POST']` | `Yes` | `system:ticket:main` |
| `applications/view/api/notification.py` | 106 | `mark_as_handled` | `POST` | `'/handle/<int:ticket_id>', methods=['POST']` | `Yes` | `system:ticket:edit` |
| `applications/view/api/notification.py` | 123 | `revoke_handled` | `POST` | `'/revoke/<int:ticket_id>', methods=['POST']` | `Yes` | `system:ticket:edit` |
| `applications/view/api/notification.py` | 139 | `get_ticket_status` | `GET` | `'/status/<int:ticket_id>', methods=['GET']` | `Yes` | `system:ticket:main` |
| `applications/view/api/ticket.py` | 14 | `get_ticket_analytics` | `GET` | `'/analytics', methods=['GET']` | `Yes` | `system:ticket:main` |
| `applications/view/system/dept.py` | 14 | `main` | `GET` | `'/'` | `No` | `system:dept:main` |
| `applications/view/system/dept.py` | 20 | `data` | `POST` | `'/data'` | `No` | `system:dept:main` |
| `applications/view/system/dept.py` | 45 | `add` | `GET` | `'/add'` | `No` | `system:dept:add` |
| `applications/view/system/dept.py` | 51 | `tree` | `GET` | `'/tree'` | `No` | `system:dept:main` |
| `applications/view/system/dept.py` | 64 | `save` | `POST` | `'/save'` | `No` | `system:dept:add` |
| `applications/view/system/dept.py` | 83 | `edit` | `GET` | `'/edit'` | `No` | `system:dept:edit` |
| `applications/view/system/dict.py` | 16 | `main` | `GET` | `'/'` | `No` | `system:dict:main` |
| `applications/view/system/dict.py` | 22 | `dict_type_data` | `GET` | `'/dictType/data'` | `No` | `system:dict:main` |
| `applications/view/system/dict.py` | 40 | `dict_type_add` | `GET` | `'/dictType/add'` | `No` | `system:dict:add` |
| `applications/view/system/dict.py` | 46 | `dict_type_save` | `POST` | `'/dictType/save'` | `No` | `system:dict:add` |
| `applications/view/system/dict.py` | 76 | `dict_type_edit` | `GET` | `'/dictType/edit'` | `No` | `system:dict:edit` |
| `applications/view/system/dict.py` | 156 | `dict_code_data` | `GET` | `'/dictData/data'` | `No` | `system:dict:main` |
| `applications/view/system/dict.py` | 167 | `dict_data_add` | `GET` | `'/dictData/add'` | `No` | `system:dict:add` |
| `applications/view/system/dict.py` | 175 | `dict_data_save` | `POST` | `'/dictData/save'` | `No` | `system:dict:add` |
| `applications/view/system/dict.py` | 195 | `dict_data_edit` | `GET` | `'/dictData/edit'` | `No` | `system:dict:edit` |
| `applications/view/system/file.py` | 14 | `index` | `GET` | `'/'` | `No` | `system:file:main` |
| `applications/view/system/file.py` | 21 | `table` | `GET` | `'/table'` | `No` | `system:file:main` |
| `applications/view/system/file.py` | 31 | `upload` | `GET` | `'/upload'` | `No` | `system:file:add` |
| `applications/view/system/file.py` | 38 | `upload_api` | `POST` | `'/upload'` | `No` | `system:file:add` |
| `applications/view/system/file.py` | 58 | `delete` | `GET,POST` | `'/delete', methods=['GET', 'POST']` | `No` | `system:file:delete` |
| `applications/view/system/file.py` | 70 | `batch_remove` | `GET,POST` | `'/batchRemove', methods=['GET', 'POST']` | `No` | `system:file:delete` |
| `applications/view/system/index.py` | 8 | `index` | `GET` | `'/'` | `Yes` | `-` |
| `applications/view/system/index.py` | 27 | `mobile_home` | `GET` | `'/m'` | `Yes` | `-` |
| `applications/view/system/index.py` | 35 | `mobile_home_readable` | `GET` | `'/mobile'` | `Yes` | `-` |
| `applications/view/system/index.py` | 42 | `mobile_workboard` | `GET` | `'/m/workboard'` | `Yes` | `-` |
| `applications/view/system/index.py` | 49 | `mobile_tickets` | `GET` | `'/m/tickets'` | `Yes` | `-` |
| `applications/view/system/index.py` | 56 | `mobile_suggestions` | `GET` | `'/m/suggestions'` | `Yes` | `-` |
| `applications/view/system/log.py` | 15 | `main` | `GET` | `'/'` | `No` | `system:log:main` |
| `applications/view/system/log.py` | 22 | `login_log` | `GET` | `'/loginLog'` | `No` | `system:log:main` |
| `applications/view/system/log.py` | 65 | `operate_log` | `GET` | `'/operateLog'` | `No` | `system:log:main` |
| `applications/view/system/log.py` | 107 | `data` | `GET` | `'/data'` | `No` | `system:log:main` |
| `applications/view/system/mail.py` | 19 | `main` | `GET` | `'/'` | `No` | `system:mail:main` |
| `applications/view/system/mail.py` | 26 | `data` | `GET` | `'/data'` | `No` | `system:mail:main` |
| `applications/view/system/mail.py` | 50 | `add` | `GET` | `'/add'` | `No` | `system:mail:add` |
| `applications/view/system/mail.py` | 56 | `save` | `POST` | `'/save'` | `No` | `system:mail:add` |
| `applications/view/system/monitor.py` | 81 | `main` | `GET` | `'/'` | `No` | `system:monitor:main` |
| `applications/view/system/monitor.py` | 96 | `ajax_polling` | `GET` | `'/polling'` | `No` | `system:monitor:main` |
| `applications/view/system/monitor.py` | 162 | `kill` | `GET` | `'/kill'` | `No` | `system:monitor:main` |
| `applications/view/system/passport.py` | 15 | `captcha` | `GET` | `'/getCaptcha'` | `No` | `-` |
| `applications/view/system/passport.py` | 23 | `debug_captcha` | `GET` | `'/debug_captcha'` | `No` | `-` |
| `applications/view/system/passport.py` | 34 | `login` | `GET` | `'/login'` | `No` | `-` |
| `applications/view/system/passport.py` | 57 | `login_post` | `POST` | `'/login'` | `No` | `-` |
| `applications/view/system/passport.py` | 115 | `heartbeat` | `GET` | `'/heartbeat'` | `Yes` | `-` |
| `applications/view/system/passport.py` | 125 | `check_session` | `GET` | `'/check_session'` | `Yes` | `-` |
| `applications/view/system/passport.py` | 140 | `logout` | `POST` | `'/logout'` | `Yes` | `-` |
| `applications/view/system/power.py` | 15 | `index` | `GET` | `'/'` | `No` | `system:power:main` |
| `applications/view/system/power.py` | 21 | `data` | `POST` | `'/data'` | `No` | `system:power:main` |
| `applications/view/system/power.py` | 46 | `add` | `GET` | `'/add'` | `No` | `system:power:add` |
| `applications/view/system/power.py` | 52 | `select_parent` | `GET` | `'/selectParent'` | `No` | `system:power:main` |
| `applications/view/system/power.py` | 67 | `save` | `POST` | `'/save'` | `No` | `system:power:add` |
| `applications/view/system/power.py` | 93 | `edit` | `GET` | `'/edit/<int:_id>'` | `No` | `system:power:edit` |
| `applications/view/system/product_suggestion.py` | 19 | `main` | `GET` | `'/'` | `No` | `system:product_suggestion:main` |
| `applications/view/system/product_suggestion.py` | 25 | `test_delete_refresh` | `N/A` | `'/test_delete_refresh'` | `No` | `system:product_suggestion:main` |
| `applications/view/system/product_suggestion.py` | 31 | `force_refresh` | `POST` | `'/force_refresh'` | `No` | `system:product_suggestion:main` |
| `applications/view/system/product_suggestion.py` | 38 | `add_view` | `GET` | `'/add'` | `No` | `system:product_suggestion:add` |
| `applications/view/system/product_suggestion.py` | 46 | `table_data` | `GET` | `'/table'` | `No` | `system:product_suggestion:main` |
| `applications/view/system/product_suggestion.py` | 186 | `save` | `POST` | `'/save'` | `No` | `system:product_suggestion:add` |
| `applications/view/system/product_suggestion.py` | 267 | `view_view` | `GET` | `'/view/<int:suggestion_id>'` | `No` | `system:product_suggestion:main` |
| `applications/view/system/product_suggestion.py` | 288 | `edit_view` | `GET` | `'/edit/<int:suggestion_id>'` | `No` | `system:product_suggestion:edit` |
| `applications/view/system/product_suggestion.py` | 313 | `update` | `POST` | `'/update'` | `No` | `system:product_suggestion:edit` |
| `applications/view/system/product_suggestion.py` | 382 | `delete` | `POST` | `'/delete'` | `No` | `system:product_suggestion:delete` |
| `applications/view/system/product_suggestion.py` | 422 | `batch_delete` | `POST` | `'/batchDelete'` | `No` | `system:product_suggestion:delete` |
| `applications/view/system/rights.py` | 21 | `configs` | `GET` | `'/configs'` | `Yes` | `-` |
| `applications/view/system/rights.py` | 102 | `message` | `GET` | `'/message'` | `Yes` | `-` |
| `applications/view/system/rights.py` | 267 | `menu` | `GET` | `'/menu'` | `Yes` | `-` |
| `applications/view/system/rights.py` | 366 | `welcome` | `GET` | `'/welcome'` | `Yes` | `-` |
| `applications/view/system/rights.py` | 375 | `rights_main` | `GET` | `'/'` | `No` | `system:main:view` |
| `applications/view/system/rights.py` | 417 | `get_ticket_overview` | `GET` | `'/api/ticket_overview'` | `Yes` | `-` |
| `applications/view/system/rights.py` | 468 | `get_pending_tickets_data` | `GET` | `'/api/pending_tickets_data'` | `Yes` | `-` |
| `applications/view/system/role.py` | 15 | `main` | `GET` | `'/'` | `No` | `system:role:main` |
| `applications/view/system/role.py` | 22 | `table` | `GET` | `'/data'` | `No` | `system:role:main` |
| `applications/view/system/role.py` | 37 | `add` | `GET` | `'/add'` | `No` | `system:role:add` |
| `applications/view/system/role.py` | 44 | `save` | `POST` | `'/save'` | `No` | `system:role:add` |
| `applications/view/system/role.py` | 76 | `power` | `GET` | `'/power/<int:_id>'` | `No` | `system:role:power` |
| `applications/view/system/role.py` | 83 | `get_role_power` | `GET` | `'/getRolePower/<int:id>'` | `No` | `system:role:main` |
| `applications/view/system/role.py` | 127 | `edit` | `GET` | `'/edit/<int:id>'` | `No` | `system:role:edit` |
| `applications/view/system/sla_api.py` | 17 | `record_business_recovery` | `POST` | `'/record_business_recovery'` | `No` | `system:ticket:edit` |
| `applications/view/system/sla_api.py` | 44 | `record_complete_fix` | `POST` | `'/record_complete_fix'` | `No` | `system:ticket:edit` |
| `applications/view/system/sla_api.py` | 71 | `get_ticket_sla_info` | `GET` | `'/info/<int:ticket_id>'` | `No` | `system:ticket:main` |
| `applications/view/system/sla_api.py` | 89 | `check_ticket_overdue` | `GET` | `'/check_overdue/<int:ticket_id>'` | `No` | `system:ticket:main` |
| `applications/view/system/sla_api.py` | 107 | `get_department_sla_statistics` | `GET` | `'/department_statistics'` | `No` | `system:ticket:main` |
| `applications/view/system/ticket.py` | 289 | `main` | `GET` | `"/"` | `Yes` | `system:ticket:main` |
| `applications/view/system/ticket.py` | 318 | `add_view` | `GET` | `"/add"` | `No` | `system:ticket:add` |
| `applications/view/system/ticket.py` | 343 | `table_data` | `GET` | `"/table"` | `No` | `system:ticket:main` |
| `applications/view/system/ticket.py` | 413 | `save` | `POST` | `"/save"` | `No` | `system:ticket:add` |
| `applications/view/system/ticket.py` | 633 | `view_view` | `GET` | `"/view/<int:ticket_id>"` | `Yes` | `system:ticket:main` |
| `applications/view/system/ticket.py` | 681 | `edit_view` | `GET` | `"/edit/<int:ticket_id>"` | `No` | `system:ticket:edit` |
| `applications/view/system/ticket.py` | 800 | `load_add_data_to_edit` | `POST` | `"/load_add_data_to_edit"` | `Yes` | `system:ticket:add` |
| `applications/view/system/ticket.py` | 1509 | `get_ticket_flow` | `GET` | `"/flow/<int:ticket_id>"` | `No` | `system:ticket:main` |
| `applications/view/system/ticket.py` | 1802 | `delete` | `POST` | `"/delete"` | `No` | `system:ticket:delete` |
| `applications/view/system/ticket.py` | 1846 | `batch_delete` | `POST` | `"/batchDelete"` | `No` | `system:ticket:delete` |
| `applications/view/system/ticket.py` | 1907 | `export_tickets` | `GET` | `"/export"` | `No` | `system:ticket:main` |
| `applications/view/system/ticket.py` | 2134 | `customer_ticket_main` | `GET` | `"/customer"` | `Yes` | `system:customer_ticket:main` |
| `applications/view/system/ticket.py` | 2147 | `customer_ticket_table` | `GET` | `"/customer_table"` | `Yes` | `system:customer_ticket:main` |
| `applications/view/system/ticket.py` | 2212 | `claim_ticket` | `POST` | `"/claim/<int:ticket_id>"` | `Yes` | `system:customer_ticket:claim` |
| `applications/view/system/ticket.py` | 2244 | `batch_claim_tickets` | `POST` | `"/batch_claim"` | `Yes` | `system:customer_ticket:claim` |
| `applications/view/system/upload.py` | 13 | `upload_image` | `POST` | `"/image"` | `No` | `system:file:add` |
| `applications/view/system/upload.py` | 39 | `get_image` | `GET` | `"/image/<int:photo_id>"` | `No` | `system:file:main` |
| `applications/view/system/upload.py` | 55 | `get_image_base64` | `GET` | `"/image_base64/<int:photo_id>"` | `No` | `system:file:main` |
| `applications/view/system/user.py` | 18 | `main` | `GET` | `'/'` | `No` | `system:user:main` |
| `applications/view/system/user.py` | 25 | `data` | `GET` | `'/data'` | `No` | `system:user:main` |
| `applications/view/system/user.py` | 61 | `add` | `GET` | `'/add'` | `No` | `system:user:add` |
| `applications/view/system/user.py` | 68 | `save` | `POST` | `'/save'` | `No` | `system:user:add` |
| `applications/view/system/user.py` | 111 | `edit` | `GET` | `'/edit/<int:id>'` | `No` | `system:user:edit` |
| `applications/view/system/user.py` | 144 | `center` | `GET` | `'/center'` | `Yes` | `-` |
| `applications/view/system/user.py` | 154 | `profile` | `GET` | `'/profile'` | `Yes` | `-` |
| `applications/view/system/user.py` | 186 | `edit_password` | `GET` | `'/editPassword'` | `Yes` | `-` |
| `applications/view/system/workboard.py` | 8 | `main` | `GET` | `'/'` | `No` | `system:workboard:main` |
| `applications/view/system/workboard.py` | 23 | `get_workboard_data` | `GET` | `'/data', methods=['GET']` | `No` | `system:workboard:main` |