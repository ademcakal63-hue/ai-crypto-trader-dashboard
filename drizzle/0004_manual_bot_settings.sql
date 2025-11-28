-- Drop old bot_settings table
DROP TABLE IF EXISTS `bot_settings`;

-- Create new bot_settings table
CREATE TABLE `bot_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `binance_api_key` text,
  `binance_api_secret` text,
  `is_connected` boolean NOT NULL DEFAULT false,
  `used_capital` varchar(20) NOT NULL,
  `compound_enabled` boolean NOT NULL DEFAULT false,
  `daily_loss_limit_percent` varchar(10) NOT NULL DEFAULT '4.00',
  `risk_per_trade_percent` varchar(10) NOT NULL DEFAULT '2.00',
  `max_daily_trades` int NOT NULL DEFAULT 10,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
