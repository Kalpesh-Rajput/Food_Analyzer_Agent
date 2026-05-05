import base64
from io import BytesIO
from PIL import Image
from backend.main import analyze_food, AnalyzeRequest

img = Image.new('RGB', (10, 10), color='white')
buf = BytesIO()
img.save(buf, format='PNG')
img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

try:
    req = AnalyzeRequest(image_base64=img_b64, user_message='test')
    res = analyze_food(req)
    print('SUCCESS', res)
except Exception as e:
    import traceback
    traceback.print_exc()
