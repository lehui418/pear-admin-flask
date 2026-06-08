USE `pear_ticket`;

-- ticket hot-path indexes
CREATE INDEX `idx_ticket_status_create_time` ON `ticket` (`status`, `create_time`);
CREATE INDEX `idx_ticket_assignee_create_time` ON `ticket` (`assignee_name`, `create_time`);
CREATE INDEX `idx_ticket_priority_create_time` ON `ticket` (`priority`, `create_time`);
CREATE INDEX `idx_ticket_source_create_time` ON `ticket` (`source`, `create_time`);

-- ticket_flow hot-path indexes
CREATE INDEX `idx_ticket_flow_ticket_create_time` ON `ticket_flow` (`ticket_id`, `create_time`);
CREATE INDEX `idx_ticket_flow_to_status_create_time` ON `ticket_flow` (`to_status`, `create_time`);
CREATE INDEX `idx_ticket_flow_handler_create_time` ON `ticket_flow` (`handler`, `create_time`);
