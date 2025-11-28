CREATE TABLE `bot_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`total_capital` varchar(20) NOT NULL,
	`used_capital` varchar(20) NOT NULL,
	`compound_enabled` boolean NOT NULL DEFAULT false,
	`daily_loss_limit_percent` varchar(10) NOT NULL DEFAULT '4.00',
	`risk_per_trade_percent` varchar(10) NOT NULL DEFAULT '2.00',
	`max_daily_trades` int NOT NULL DEFAULT 10,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bot_settings_id` PRIMARY KEY(`id`)
);
