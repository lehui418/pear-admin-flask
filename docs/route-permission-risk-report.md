# Route Permission Risk Report

Generated from `docs/route-permission-matrix.md`.
`authorize(...)` is treated as both login + permission protection.

- Total routes analyzed: **117**
- Public whitelist matched: **5**
- Unprotected routes (non-whitelist): **0**
- Login-only routes (non-whitelist): **18**

## 1) Unprotected routes (non-whitelist)
- None

## 2) Login-only routes (non-whitelist)
- `GET` `/` -> `index` ([applications/view/system/index.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/index.py:8))
- `GET` `/m` -> `mobile_home` ([applications/view/system/index.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/index.py:27))
- `GET` `/mobile` -> `mobile_home_readable` ([applications/view/system/index.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/index.py:35))
- `GET` `/m/workboard` -> `mobile_workboard` ([applications/view/system/index.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/index.py:42))
- `GET` `/m/tickets` -> `mobile_tickets` ([applications/view/system/index.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/index.py:49))
- `GET` `/m/suggestions` -> `mobile_suggestions` ([applications/view/system/index.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/index.py:56))
- `GET` `/heartbeat` -> `heartbeat` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:115))
- `GET` `/check_session` -> `check_session` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:125))
- `POST` `/logout` -> `logout` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:140))
- `GET` `/configs` -> `configs` ([applications/view/system/rights.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/rights.py:21))
- `GET` `/message` -> `message` ([applications/view/system/rights.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/rights.py:102))
- `GET` `/menu` -> `menu` ([applications/view/system/rights.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/rights.py:267))
- `GET` `/welcome` -> `welcome` ([applications/view/system/rights.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/rights.py:366))
- `GET` `/api/ticket_overview` -> `get_ticket_overview` ([applications/view/system/rights.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/rights.py:417))
- `GET` `/api/pending_tickets_data` -> `get_pending_tickets_data` ([applications/view/system/rights.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/rights.py:468))
- `GET` `/center` -> `center` ([applications/view/system/user.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/user.py:144))
- `GET` `/profile` -> `profile` ([applications/view/system/user.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/user.py:154))
- `GET` `/editPassword` -> `edit_password` ([applications/view/system/user.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/user.py:186))

## 3) Public whitelist routes
- `GET` `/loginLog` -> `login_log` ([applications/view/system/log.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/log.py:22))
- `GET` `/getCaptcha` -> `captcha` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:15))
- `GET` `/debug_captcha` -> `debug_captcha` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:23))
- `GET` `/login` -> `login` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:34))
- `POST` `/login` -> `login_post` ([applications/view/system/passport.py](D:/工作梳理/售后工单/202604/202603/202603/pear-admin-flask/applications/view/system/passport.py:57))