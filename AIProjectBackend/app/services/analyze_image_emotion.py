import cv2
import cv2.data
from deepface import DeepFace
from collections import defaultdict
import time

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

cap = cv2.VideoCapture(1)

emotion_scores = defaultdict(list)
start_time = time.time()
interval = 1.0 
last_analysis_time = 0
total_duration = 90
print("Analiz başlatıldı (çıkış: q)")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.time()
    elapsed = current_time - start_time

    if current_time - last_analysis_time >= interval:
        try:
            result = DeepFace.analyze(
                frame,
                actions=['emotion'],
                enforce_detection=False,
            )
            if isinstance(result, list):
                result = result[0]

            emotions = result['emotion']
            dominant_emotion = result['dominant_emotion']

            # duyguları kaydet
            for k, v in emotions.items():
                emotion_scores[k].append(v)

            # ekrana yaz
            print(f"{int(elapsed)}s -> {dominant_emotion}")

            last_analysis_time = current_time

        except Exception as e:
            print("Analiz hatası:", e)

    # yüzleri çiz
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    cv2.imshow("Emotion Tracker", frame)

    if elapsed > total_duration:
        print("\n Süre doldu, analiz tamamlanıyor...")
        break

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

print("\n Ortalama duygu skorları:")
avg_emotions = {}
for k, v in emotion_scores.items():
    if v:
        avg_emotions[k] = sum(v) / len(v)
        print(f"{k:>12}: {avg_emotions[k]:.2f}")


if avg_emotions:
    dominant_avg = max(avg_emotions, key=avg_emotions.get)
    print(f"\n Genel ortalama duygu: {dominant_avg.upper()} ({avg_emotions[dominant_avg]:.2f})")
else:
    print("Yeterli veri yok.")



# import cv2 
# import cv2.data
# from deepface import DeepFace

# faceCascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# cap = cv2.VideoCapture(1)

# while True:
#     ret,frame = cap.read()
#     result = DeepFace.analyze(frame,actions=['emotion'],enforce_detection=False)
#     emotion = result[0]['dominant_emotion']

#     gray = cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
#     faces = faceCascade.detectMultiScale(gray,1.1,4)

#     for(x,y,w,h) in faces : 
#         cv2.rectangle(frame,(x,y),(x+w,y+h),(0,255,0),2)

#     font = cv2.FONT_HERSHEY_COMPLEX
#     cv2.putText(frame,emotion,(50,50),font,3,(255,0,0),2,cv2.LINE_4)    
#     cv2.imshow('Video',frame)

#     if cv2.waitKey(2) & 0xFF == ord('q'):
#         break
# cap.release()
# cv2.destroyAllWindows()    
