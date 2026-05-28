import json
import os
import psycopg2

SCHEMA = 't_p89199296_sberbank_toy_termina'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Получение и сохранение настроек терминала"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(f"SELECT key, value FROM {SCHEMA}.settings")
            rows = cur.fetchall()
            data = {r[0]: r[1] for r in rows}
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps(data, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            for key, value in body.items():
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.settings (key, value) VALUES (%s, %s)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
                """, (key, str(value)))
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    finally:
        cur.close()
        conn.close()
