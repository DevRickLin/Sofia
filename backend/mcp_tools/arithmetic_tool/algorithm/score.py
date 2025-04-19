import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json
import os
import openai
import json
from pathlib import Path

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Article(BaseModel):
    """文章模型类"""
    content: str
    title: Optional[str] = None
    author: Optional[str] = None
    
    def word_count(self) -> int:
        """计算文章字数"""
        return len(self.content)

class ScoreResult(BaseModel):
    """评分结果模型"""
    quality_score: float
    relevance_score: Optional[float] = None
    total_score: float
    details: Dict[str, Any]

class ArticleScorer:
    """文章评分类"""
    
    def __init__(self, quality_weight: float = 0.6, relevance_weight: float = 0.4):
        """
        初始化评分器
        
        参数:
            quality_weight: 文章质量评分权重
            relevance_weight: 文章与知识库关联度评分权重
        """
        self.quality_weight = quality_weight
        self.relevance_weight = relevance_weight
        logger.info(f"初始化评分器: 质量权重={quality_weight}, 关联度权重={relevance_weight}")
        
        # 读取评分prompt
        prompt_path = Path(__file__).parent / "prompt" / "eval_quality.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.quality_prompt_template = f.read()
    
    def score_article(self, article: Article, knowledge_base: Optional[Any] = None) -> ScoreResult:
        """
        对文章进行综合评分
        
        参数:
            article: 要评分的文章
            knowledge_base: 知识库对象(可选)
            
        返回:
            ScoreResult: 评分结果
        """
        # 计算文章质量分数
        quality_score, quality_details = self._score_article_quality(article)
        
        # 计算文章与知识库关联度分数
        relevance_score, relevance_details = self._score_article_relevance(article, knowledge_base)
        
        # 计算总分
        total_score = (quality_score * self.quality_weight + 
                      (relevance_score * self.relevance_weight if relevance_score else quality_score))
        
        # 构建详细评分信息
        details = {
            "quality": {
                "score": quality_score,
                "weight": self.quality_weight,
                "details": quality_details
            }
        }
        
        if relevance_score:
            details["relevance"] = {
                "score": relevance_score,
                "weight": self.relevance_weight,
                "details": relevance_details
            }
        
        logger.info(f"文章评分完成: 质量分={quality_score}, 总分={total_score}")
        
        return ScoreResult(
            quality_score=quality_score,
            relevance_score=relevance_score if relevance_score else None,
            total_score=total_score,
            details=details
        )
    
    def _score_article_quality(self, article: Article) -> tuple[float, Dict[str, Any]]:
        """
        评估文章本身的质量
        
        参数:
            article: 要评分的文章
            
        返回:
            tuple: (质量分数, 详细评分信息)
        """
        try:
            # 准备prompt，将文章内容填充到模板中
            prompt = self.quality_prompt_template.format(artical=article.content)
            
            # 调用OpenAI API获取评分结果
            response = openai.chat.completions.create(
                model=os.environ.get("LLM_MODEL", "gpt-3.5-turbo"),
                messages=[
                    {"role": "system", "content": "你是一位专业的文本质量评估专家。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            
            # 提取API返回的结果
            result_text = response.choices[0].message.content
            
            # 尝试解析JSON结果
            try:
                # 提取JSON部分
                json_start = result_text.find('{')
                json_end = result_text.rfind('}') + 1
                json_str = result_text[json_start:json_end] if json_start >= 0 and json_end > 0 else "{}"
                
                result = json.loads(json_str)
                
                # 计算总分 - 所有评分维度的平均值
                dimensions = result.get("score", {})
                scores = [value for value in dimensions.values() if isinstance(value, (int, float))]
                average_score = sum(scores) / len(scores) if scores else 0
                
                details = {
                    "dimensions": dimensions,
                    "advantage": result.get("advantage", ""),
                    "disadvantage": result.get("disadvantage", ""),
                    "general_evaluation": result.get("general_evaluation", "")
                }
                
                logger.info(f"文章质量评分完成，总分: {average_score}")
                return average_score, details
                
            except json.JSONDecodeError as e:
                logger.error(f"解析评分结果JSON失败: {e}")
                logger.error(f"原始结果: {result_text}")
                return 0, {"error": f"解析结果失败: {str(e)}", "raw_response": result_text}
                
        except Exception as e:
            logger.error(f"评估文章质量时发生错误: {e}")
            return 0, {"error": str(e)}
    
    def _score_article_relevance(self, article: Article, knowledge_base: Optional[Any] = None) -> tuple[float, Dict[str, Any]]:
        """
        评估文章与知识库的关联度
        
        参数:
            article: 要评分的文章
            knowledge_base: 知识库对象(可选)
            
        返回:
            tuple: (关联度分数, 详细评分信息)
        """
        relevance_score = 0.0
        relevance_details = {}
        
        if knowledge_base:
            # TODO: 实现文章与知识库关联度评分
            # 这里可以添加关联度评分的具体实现
            pass
        
        return relevance_score, relevance_details
