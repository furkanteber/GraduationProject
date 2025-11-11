from pymongo import MongoClient
from datetime import datetime

def get_db():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["aiProjectDB"]
        return db
    except Exception as e:
        print(f"[MongoDB] ❌ Bağlantı hatası: {e}")
        return None


def insert_documents(collection_name, documents):
    db = get_db()
    if db is None:  # ✅ doğru kontrol
        print("[MongoDB] ❌ Bağlantı başarısız, veri kaydedilemedi.")
        return
    try:
        collection = db[collection_name]
        result = collection.insert_many(documents)
        print(f"[MongoDB] ✅ {len(result.inserted_ids)} belge eklendi.")
    except Exception as e:
        print(f"[MongoDB] ❌ Ekleme hatası: {e}")


def test_connection():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        client.admin.command("ping")
        print("[MongoDB] ✅ Bağlantı başarılı!")
        db = client["aiProjectDB"]
        print(f"[MongoDB] Kullanılan veritabanı: {db.name}")
        return True
    except Exception as e:
        print(f"[MongoDB] ❌ Bağlantı hatası: {e}")
        return False


if __name__ == "__main__":
    test_connection()
