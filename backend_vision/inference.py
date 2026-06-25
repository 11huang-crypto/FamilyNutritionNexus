"""
果蔬识别推理模块
模型: MobileNetV2, 46类, Val Acc 94.13%
训练数据: VegFru + GroceryStoreDataset (纯实拍图)

用法:
    from inference import FruitPredictor
    predictor = FruitPredictor()
    result = predictor.predict("path/to/image.jpg")
    # result = {"class": "apple", "confidence": 0.95, "top3": [...]}
"""

import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from pathlib import Path
import json
from typing import Dict, List, Tuple, Optional


class FruitPredictor:
    """果蔬识别器，加载 MobileNetV2 模型进行推理"""

    def __init__(
        self,
        model_path: Optional[str] = None,
        device: Optional[str] = None
    ):
        """
        Args:
            model_path: 模型权重路径，默认 backend_vision/model/checkpoints/best_model.pth
            device: 推理设备，默认自动选择 cuda/cpu
        """
        if model_path is None:
            model_path = Path(__file__).parent / "model" / "checkpoints" / "best_model.pth"
        self.model_path = Path(model_path)

        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self._load_model()
        self._init_transform()

    def _load_model(self):
        """加载 checkpoint 并构建模型"""
        ckpt = torch.load(self.model_path, map_location=self.device, weights_only=False)

        self.idx_to_name: List[str] = ckpt["idx_to_name"]
        self.num_classes: int = ckpt["num_classes"]
        self.val_acc: float = ckpt["val_acc"]

        # 与训练时结构完全一致
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = torch.nn.Sequential(
            torch.nn.Dropout(0.4),
            torch.nn.Linear(model.classifier[1].in_features, self.num_classes)
        )
        model.load_state_dict(ckpt["model_state_dict"])
        model.to(self.device)
        model.eval()

        self.model = model
        print(f"[FruitPredictor] Loaded {self.num_classes} classes, Val Acc={self.val_acc*100:.2f}%, device={self.device}")

    def _init_transform(self):
        """初始化图像预处理（与训练一致）"""
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def predict(
        self,
        image: Image.Image,
        top_k: int = 3
    ) -> Dict:
        """
        对单张 PIL Image 进行预测

        Args:
            image: PIL Image 对象 (RGB)
            top_k: 返回 Top-K 结果

        Returns:
            {
                "class": str,           # Top-1 类别名
                "confidence": float,    # Top-1 置信度
                "top3": [
                    {"class": str, "confidence": float},
                    ...
                ]
            }
        """
        img = image.convert("RGB")
        input_tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(input_tensor)
            probs = torch.softmax(output, dim=1)
            topk_prob, topk_idx = torch.topk(probs, min(top_k, self.num_classes), dim=1)

        top1_class = self.idx_to_name[topk_idx[0][0].item()]
        top1_conf = round(topk_prob[0][0].item(), 4)

        top3 = [
            {
                "class": self.idx_to_name[topk_idx[0][i].item()],
                "confidence": round(topk_prob[0][i].item(), 4)
            }
            for i in range(min(top_k, self.num_classes))
        ]

        return {
            "class": top1_class,
            "confidence": top1_conf,
            "top3": top3
        }

    def predict_file(self, image_path: str, top_k: int = 3) -> Dict:
        """对图片文件进行预测"""
        img = Image.open(image_path)
        return self.predict(img, top_k)

    def get_classes(self) -> List[str]:
        """返回所有类别名称列表"""
        return self.idx_to_name.copy()

    def get_class_info(self, class_name: str) -> Dict:
        """查询某个类别是否存在及索引"""
        try:
            idx = self.idx_to_name.index(class_name)
            return {"found": True, "index": idx, "name": class_name}
        except ValueError:
            return {"found": False, "index": None, "name": class_name}


# 全局单例
_predictor: Optional[FruitPredictor] = None


def get_predictor() -> FruitPredictor:
    """获取全局预测器单例（懒加载）"""
    global _predictor
    if _predictor is None:
        _predictor = FruitPredictor()
    return _predictor
