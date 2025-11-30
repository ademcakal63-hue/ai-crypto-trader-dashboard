"""
Notification Writer: Bildirimleri direkt database'e yaz
Dashboard API yerine direkt MySQL'e yazarak daha güvenilir bildirimler
"""

import os
import mysql.connector
from datetime import datetime
from typing import Optional


class NotificationWriter:
    """Bildirimleri direkt database'e yaz"""
    
    def __init__(self):
        # Database URL'den connection bilgilerini parse et
        database_url = os.getenv("DATABASE_URL", "")
        
        # mysql://user:password@host:port/database format
        if database_url.startswith("mysql://"):
            # Parse connection string
            parts = database_url.replace("mysql://", "").split("@")
            user_pass = parts[0].split(":")
            host_db = parts[1].split("/")
            host_port = host_db[0].split(":")
            
            self.config = {
                "user": user_pass[0],
                "password": user_pass[1],
                "host": host_port[0],
                "port": int(host_port[1]) if len(host_port) > 1 else 3306,
                "database": host_db[1].split("?")[0],  # Remove query params
                "ssl_ca": None,  # Use default SSL
                "ssl_verify_cert": False,  # Don't verify cert for TiDB Cloud
                "ssl_verify_identity": False
            }
        else:
            # Fallback to default
            self.config = {
                "host": "localhost",
                "port": 3306,
                "user": "root",
                "password": "",
                "database": "ai_crypto_trader"
            }
    
    def write_notification(
        self,
        notification_type: str,
        title: str,
        message: str,
        severity: str = "INFO",
        data: Optional[str] = None
    ) -> bool:
        """Bildirim yaz"""
        
        try:
            # Database bağlantısı
            conn = mysql.connector.connect(**self.config)
            cursor = conn.cursor()
            
            # Insert query
            query = """
                INSERT INTO notifications (type, title, message, severity, `read`, data, createdAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                notification_type,
                title,
                message,
                severity,
                False,  # read = false
                data,
                datetime.now()
            )
            
            cursor.execute(query, values)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            print(f"✅ Bildirim database'e yazıldı: {title}")
            return True
            
        except Exception as e:
            print(f"⚠️ Bildirim yazma hatası: {e}")
            return False


# Test
if __name__ == "__main__":
    writer = NotificationWriter()
    
    # Test notification
    result = writer.write_notification(
        notification_type="COST_WARNING",
        title="⚠️ Maliyet Limiti Yakın (test)",
        message="Mevcut maliyet: $8.50\nLimit: $10.00\nKullanım: %85",
        severity="WARNING"
    )
    
    print(f"\nTest result: {result}")
