CREATE TABLE `ai_learning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_version` varchar(20) NOT NULL,
	`patterns_learned` int NOT NULL,
	`expert_trades_integrated` int NOT NULL,
	`last_fine_tune_date` timestamp NOT NULL,
	`improvements` text,
	`performance_before_tuning` varchar(10),
	`performance_after_tuning` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_learning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`starting_balance` varchar(20) NOT NULL,
	`ending_balance` varchar(20) NOT NULL,
	`daily_pnl` varchar(20) NOT NULL,
	`daily_pnl_percentage` varchar(10) NOT NULL,
	`total_trades` int NOT NULL,
	`winning_trades` int NOT NULL,
	`losing_trades` int NOT NULL,
	`win_rate` varchar(10) NOT NULL,
	`average_r_ratio` varchar(10) NOT NULL,
	`best_trade` varchar(20),
	`worst_trade` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `performance_metrics_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`direction` enum('LONG','SHORT') NOT NULL,
	`entry_price` varchar(20) NOT NULL,
	`current_price` varchar(20) NOT NULL,
	`stop_loss` varchar(20) NOT NULL,
	`take_profit` varchar(20) NOT NULL,
	`position_size` varchar(20) NOT NULL,
	`risk_amount` varchar(20) NOT NULL,
	`pnl` varchar(20) NOT NULL,
	`pnl_percentage` varchar(10) NOT NULL,
	`status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
	`pattern` text,
	`confidence` varchar(10),
	`opened_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`direction` enum('LONG','SHORT') NOT NULL,
	`entry_price` varchar(20) NOT NULL,
	`exit_price` varchar(20) NOT NULL,
	`stop_loss` varchar(20) NOT NULL,
	`take_profit` varchar(20) NOT NULL,
	`position_size` varchar(20) NOT NULL,
	`risk_amount` varchar(20) NOT NULL,
	`pnl` varchar(20) NOT NULL,
	`pnl_percentage` varchar(10) NOT NULL,
	`r_ratio` varchar(10) NOT NULL,
	`result` enum('WIN','LOSS') NOT NULL,
	`exit_reason` varchar(50) NOT NULL,
	`pattern` text,
	`confidence` varchar(10),
	`duration` int,
	`opened_at` timestamp NOT NULL,
	`closed_at` timestamp NOT NULL,
	CONSTRAINT `trade_history_id` PRIMARY KEY(`id`)
);
