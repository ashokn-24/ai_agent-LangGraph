from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from dotenv import dotenv_values
import langgraph.graph as lg  

config = dotenv_values(".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config["SERVER_ORIGIN"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
db_password = config["DB_CLUSTER_KEY"]
MONGO_URI = f"mongodb+srv://ashokwick123:{db_password}@cluster0.v9wbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = config["DB_NAME"]

@app.on_event("startup")
def startup_db_client():
    """Connect to MongoDB on app startup."""
    app.state.mongodb_client = MongoClient(MONGO_URI)
    app.state.database = app.state.mongodb_client[DB_NAME]
    print("Connected to MongoDB!")

@app.on_event("shutdown")
def shutdown_db_client():
    """Close MongoDB connection on app shutdown."""
    app.state.mongodb_client.close()

genai.configure(api_key=config["GEN_AI_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")


def fetch_suppliers(product_name):
    """Retrieve suppliers from MongoDB for a given product."""
    db = app.state.database
    suppliers = list(db["suppliers"].find({"product_name": product_name}))

    if not suppliers:
        raise HTTPException(status_code=404, detail="No suppliers found for this product")

    return suppliers  

def summarize_supplier(data):
    """Generates AI summary for supplier details."""
    supplier_info = f"Supplier Name: {data['name']}, Location: {data['location']}"
    
    try:
        ai_response = model.generate_content(f"Summarize this supplier data: {supplier_info}")
        
        summary_text = ai_response.text if hasattr(ai_response, "text") else str(ai_response)

        return {"summary": summary_text}  
    
    except Exception as e:
        return {"summary": f"Error generating summary: {str(e)}"}

graph = lg.Graph()
graph.add_node("fetch_suppliers", fetch_suppliers)  
graph.add_node("generate_summary", summarize_supplier)

graph.set_entry_point("fetch_suppliers")
graph.add_edge("fetch_suppliers", "generate_summary")

executor = graph.compile()

# Models
class ProductRequest(BaseModel):
    product_name: str

class SupplierResponse(BaseModel):
    name: str
    location: str
    summary: str

@app.get("/")
def home():
    return {"message": "Supplier AI System Running"}

@app.post("/get_suppliers", response_model=list[SupplierResponse])
@app.post("/get_suppliers")
def get_suppliers(request: ProductRequest):
    db = app.state.database
    suppliers = list(db["suppliers"].find({"product_name": request.product_name}))

    if not suppliers:
        return {"message": "No suppliers found for this product."}

    response_data = {}

    for supplier in suppliers:
        supplier_info = f"Supplier Name: {supplier['name']}, Location: {supplier['location']}"

        try:
            ai_response = model.generate_content(f"Summarize this supplier data: {supplier_info}")

            summary_text = getattr(ai_response, "text", str(ai_response))

        except Exception as e:
            summary_text = f"Error generating summary: {str(e)}"

        response_data["store"] = {
            "name": supplier["name"],
            "location": supplier["location"],
            "summary": summary_text
        }

    return response_data
