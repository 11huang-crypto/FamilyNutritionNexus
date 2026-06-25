"""视觉识别服务 - 端口 8001
支持真实模型推理，模型不可用时降级为 Mock
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from PIL import Image
import io
import random

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ----- 尝试加载真实模型 -----
predictor = None
MODEL_READY = False
try:
    from inference import FruitPredictor
    predictor = FruitPredictor()
    MODEL_READY = True
    print(f"[server] Real model loaded: {predictor.num_classes} classes, Val Acc={predictor.val_acc*100:.2f}%")
except Exception as e:
    print(f"[server] Model load failed, fallback to MOCK: {e}")

# ----- Mock 兜底数据 -----
MOCK_INGREDIENTS = [
    {"name": "tomato", "name_cn": "番茄", "calories": 18, "protein": 0.9, "fat": 0.2, "carbs": 3.9, "fiber": 1.2, "vitamin_c": 13.7},
    {"name": "carrot", "name_cn": "胡萝卜", "calories": 41, "protein": 0.9, "fat": 0.2, "carbs": 9.6, "fiber": 2.8, "vitamin_c": 5.9},
    {"name": "banana", "name_cn": "香蕉", "calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 22.8, "fiber": 2.6, "vitamin_c": 8.7},
    {"name": "spinach", "name_cn": "菠菜", "calories": 23, "protein": 2.9, "fat": 0.4, "carbs": 3.6, "fiber": 2.2, "vitamin_c": 28.1},
    {"name": "apple", "name_cn": "苹果", "calories": 52, "protein": 0.3, "fat": 0.2, "carbs": 13.8, "fiber": 2.4, "vitamin_c": 4.6},
    {"name": "strawberry", "name_cn": "草莓", "calories": 32, "protein": 0.7, "fat": 0.3, "carbs": 7.7, "fiber": 2.0, "vitamin_c": 58.8},
]

# ----- Model -----
class IngredientAnalysis(BaseModel):
    name: str
    confidence: float
    nutrition: dict

class MatchingRecommendation(BaseModel):
    ingredient: str
    reason: str
    type: str

# ----- Routes -----
@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """上传图片进行果蔬识别"""
    if MODEL_READY and predictor:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        result = predictor.predict(img, top_k=3)

        top1_name = result["class"]
        confidence = result["confidence"]
        top3 = [{"name": r["class"], "confidence": r["confidence"]} for r in result["top3"]]

        return {
            "model_version": "v2",
            "model_ready": True,
            "ingredients": [{
                "name": top1_name,
                "confidence": round(confidence, 2),
                "top3": top3,
                "nutrition": _get_nutrition(top1_name)
            }],
            "recommendations": [
                {"ingredient": top1_name, "reason": "营养丰富，适合日常食用", "type": "beneficial"},
                {"ingredient": "tofu", "reason": "蛋白质互补，营养更均衡", "type": "beneficial"}
            ]
        }

    # Mock fallback
    ing = random.choice(MOCK_INGREDIENTS)
    return {
        "model_version": "mock",
        "model_ready": False,
        "ingredients": [{
            "name": ing["name_cn"],
            "confidence": round(random.uniform(0.85, 0.98), 2),
            "nutrition": {"calories": ing["calories"], "protein": ing["protein"], "fat": ing["fat"],
                         "carbs": ing["carbs"], "fiber": ing["fiber"], "vitamins": {"vitamin_c_mg": ing["vitamin_c"]}}
        }],
        "recommendations": [
            {"ingredient": ing["name_cn"], "reason": "营养丰富，适合日常食用", "type": "beneficial"},
            {"ingredient": "豆腐", "reason": "蛋白质互补，营养更均衡", "type": "beneficial"}
        ]
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "vision",
        "model_ready": MODEL_READY,
        "num_classes": predictor.num_classes if predictor else 0,
        "val_acc": round(predictor.val_acc * 100, 2) if predictor else None
    }

@app.get("/classes")
async def list_classes():
    """返回模型支持的所有类别"""
    if predictor:
        return {"num_classes": predictor.num_classes, "classes": predictor.get_classes()}
    return {"num_classes": 0, "classes": []}


def _get_nutrition(class_name: str) -> dict:
    """根据类别名获取营养信息 (mock，后续对接真实数据库)"""
    nutrition_db = {
        "apple": {"calories": 52, "protein": 0.3, "fat": 0.2, "carbs": 13.8, "fiber": 2.4, "vitamin_c": 4.6},
        "banana": {"calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 22.8, "fiber": 2.6, "vitamin_c": 8.7},
        "tomato": {"calories": 18, "protein": 0.9, "fat": 0.2, "carbs": 3.9, "fiber": 1.2, "vitamin_c": 13.7},
        "carrot": {"calories": 41, "protein": 0.9, "fat": 0.2, "carbs": 9.6, "fiber": 2.8, "vitamin_c": 5.9},
        "orange": {"calories": 47, "protein": 0.9, "fat": 0.1, "carbs": 11.8, "fiber": 2.4, "vitamin_c": 53.2},
        "grape_red": {"calories": 69, "protein": 0.7, "fat": 0.2, "carbs": 18.1, "fiber": 0.9, "vitamin_c": 3.2},
        "watermelon": {"calories": 30, "protein": 0.6, "fat": 0.2, "carbs": 7.6, "fiber": 0.4, "vitamin_c": 8.1},
        "cucumber": {"calories": 15, "protein": 0.7, "fat": 0.1, "carbs": 3.6, "fiber": 0.5, "vitamin_c": 2.8},
        "potato": {"calories": 77, "protein": 2.0, "fat": 0.1, "carbs": 17.5, "fiber": 2.2, "vitamin_c": 19.7},
    }
    default = {"calories": 50, "protein": 1.0, "fat": 0.3, "carbs": 12.0, "fiber": 2.0, "vitamin_c": 10.0}
    return nutrition_db.get(class_name, default)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
