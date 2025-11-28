CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('POSITION_OPENED','POSITION_CLOSED','RISK_LIMIT_WARNING','DAILY_LIMIT_REACHED','CONNECTION_LOST','CONNECTION_RESTORED','EMERGENCY_STOP') NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`severity` enum('INFO','WARNING','ERROR','SUCCESS') NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`data` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
