from typing import List, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from gensim.models import Word2Vec
from sentence_transformers import SentenceTransformer
import torch


_S_BERT_MODEL = None


def _get_sbert_model() -> SentenceTransformer | None:
    global _S_BERT_MODEL
    if _S_BERT_MODEL is None:
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _S_BERT_MODEL = SentenceTransformer(
                "sentence-transformers/distiluse-base-multilingual-cased-v2",
                device=device,
            )
        except Exception:
            _S_BERT_MODEL = None
    return _S_BERT_MODEL


def analyze_texts(texts: List[str]) -> Dict[str, Any]:
    texts = [t.strip() for t in texts if t and t.strip()]
    if not texts:
        return {}

    combined = " ".join(texts)
    tokens = combined.split()

    # TF-IDF
    tfidf_mean = None
    tfidf_dim = None
    try:
        vectorizer = TfidfVectorizer(max_features=1000)
        tfidf_vec = vectorizer.fit_transform([combined])  # 1 x N
        tfidf_mean = float(tfidf_vec.mean())
        tfidf_dim = int(tfidf_vec.shape[1])
    except Exception:
        pass

    # Word2Vec (küçük, session içi model)
    w2v_dim = None
    try:
        sentences = [t.split() for t in texts]
        w2v_model = Word2Vec(sentences=sentences, vector_size=100, min_count=1, workers=1, epochs=30)
        vecs = []
        for w in tokens:
            if w in w2v_model.wv:
                vecs.append(w2v_model.wv[w])
        if vecs:
            w2v_vec = np.mean(vecs, axis=0)
            w2v_dim = int(w2v_vec.shape[0])
        else:
            w2v_dim = 0
    except Exception:
        pass

    # Sentence-BERT
    sbert_dim = None
    try:
        model = _get_sbert_model()
        if model is not None:
            emb = model.encode(combined, convert_to_numpy=True)
            sbert_dim = int(emb.shape[0])
    except Exception:
        pass

    return {
        "combined_text": combined,
        "num_chars": len(combined),
        "num_tokens": len(tokens),
        "tfidf_mean": tfidf_mean,
        "tfidf_dim": tfidf_dim,
        "word2vec_dim": w2v_dim,
        "sentence_bert_dim": sbert_dim,
    }
