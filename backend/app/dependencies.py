from fastapi import Request

def get_db(request: Request):
    return request.state.mongodb 