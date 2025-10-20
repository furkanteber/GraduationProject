import cv2
from deepface import DeepFace

def start_realtime_emotion_analysis():
    """
    Bilgisayarın varsayılan kamerasını açar, anlık olarak yüz tespiti ve duygu analizi yapar.
    Sonuçları canlı video akışı üzerinde gösterir.
    Çıkmak için 'q' tuşuna basın.
    """
    # 0, bilgisayarın varsayılan kamerasını temsil eder.
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Hata: Kamera açılamadı.")
        return

    # Analiz sonuçlarını ve bir sayaç tutmak için değişkenler
    face_analysis_results = []
    frame_counter = 0
    analysis_interval = 10  # Her 10 karede bir analiz yap (performans için)

    while True:
        # Kameradan anlık bir kare (frame) oku
        ret, frame = cap.read()
        if not ret:
            print("Hata: Kameradan kare okunamadı.")
            break

        # Performans için her karede analiz yapmak yerine belirli aralıklarla yap
        if frame_counter % analysis_interval == 0:
            try:
                # DeepFace'e anlık kareyi analiz etmesi için gönder
                # enforce_detection=False, yüz bulunamazsa hata vermesini engeller
                face_analysis_results = DeepFace.analyze(
                    img_path=frame,
                    actions=['emotion'],
                    enforce_detection=False,
                    detector_backend='opencv' # Hız için opencv backend'ini kullan
                )
            except Exception as e:
                # Nadiren de olsa oluşabilecek hataları yakala
                print(f"Analiz hatası: {e}")
                face_analysis_results = []
        
        # Eğer analiz sonucu varsa (yüz bulunduysa)
        if face_analysis_results:
            for face_data in face_analysis_results:
                try:
                    # Yüzün etrafına çizilecek karenin koordinatlarını al
                    region = face_data['region']
                    x, y, w, h = region['x'], region['y'], region['w'], region['h']
                    
                    # Yüzün etrafına mavi bir kare çiz
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)

                    # Baskın duygu durumunu al
                    dominant_emotion = face_data['dominant_emotion']

                    # Duygu durumunu karenin üstüne beyaz renkte yaz
                    text_to_display = dominant_emotion.capitalize()
                    cv2.putText(
                        img=frame,
                        text=text_to_display,
                        org=(x, y - 10),
                        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                        fontScale=0.9,
                        color=(255, 255, 255),
                        thickness=2,
                        lineType=cv2.LINE_AA
                    )
                except Exception:
                    # Bazen 'region' veya 'dominant_emotion' gelmeyebilir, bu durumu atla
                    pass

        # Kare sayacını artır
        frame_counter += 1

        # Analiz edilmiş kareyi bir pencerede göster
        cv2.imshow('Anlık Duygu Analizi (Cikmak icin Q tusuna basin)', frame)

        # 'q' tuşuna basıldığında döngüyü kır ve çık
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Her şeyi serbest bırak ve pencereleri kapat
    cap.release