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


def get_random_premade_question(filter_query=None):
    db = get_db()
    if db is None:
        print("[MongoDB] ❌ Bağlantı başarısız, soru okunamadı.")
        return None
    try:
        collection = db["premadeQuestions"]
        pipeline = []
        if filter_query:
            pipeline.append({"$match": filter_query})
        pipeline.append({"$sample": {"size": 1}})
        docs = list(collection.aggregate(pipeline))
        if not docs:
            return None
        return docs[0]
    except Exception as e:
        print(f"[MongoDB] ❌ Soru okuma hatası: {e}")
        return None


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
