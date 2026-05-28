import json
import os
import psycopg2

SCHEMA = 't_p89199296_sberbank_toy_termina'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Управление транзакциями терминала: список, добавление, отмена, возврат"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET — список транзакций
        if method == 'GET':
            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            cur.execute(f"""
                SELECT id, amount, status, card_mask, created_at
                FROM {SCHEMA}.transactions
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            rows = cur.fetchall()

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.transactions")
            total = cur.fetchone()[0]

            cur.execute(f"SELECT COUNT(*), SUM(amount) FROM {SCHEMA}.transactions WHERE status = 'success'")
            stats = cur.fetchone()

            cur.execute(f"""
                SELECT COUNT(*), COALESCE(SUM(amount), 0)
                FROM {SCHEMA}.transactions
                WHERE status = 'success'
                AND created_at >= CURRENT_DATE
            """)
            today = cur.fetchone()

            transactions = []
            for r in rows:
                transactions.append({
                    'id': r[0],
                    'amount': r[1],
                    'status': r[2],
                    'card_mask': r[3],
                    'created_at': r[4].isoformat(),
                })

            return {
                'statusCode': 200,
                'headers': cors,
                'body': json.dumps({
                    'transactions': transactions,
                    'total': total,
                    'stats': {
                        'total_count': stats[0],
                        'total_amount': int(stats[1]) if stats[1] else 0,
                        'today_count': today[0],
                        'today_amount': int(today[1]) if today[1] else 0,
                    }
                }, ensure_ascii=False),
            }

        # POST — добавить транзакцию
        if method == 'POST':
            amount = int(body.get('amount', 0))
            status = body.get('status', 'success')
            card_mask = body.get('card_mask', '**** 7734')
            if amount <= 0:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Invalid amount'})}
            cur.execute(f"""
                INSERT INTO {SCHEMA}.transactions (amount, status, card_mask)
                VALUES (%s, %s, %s)
                RETURNING id, amount, status, card_mask, created_at
            """, (amount, status, card_mask))
            row = cur.fetchone()
            conn.commit()
            return {
                'statusCode': 200,
                'headers': cors,
                'body': json.dumps({
                    'id': row[0], 'amount': row[1], 'status': row[2],
                    'card_mask': row[3], 'created_at': row[4].isoformat()
                }, ensure_ascii=False),
            }

        # PUT — обновить статус (отмена/возврат)
        if method == 'PUT':
            tx_id = int(body.get('id', 0))
            new_status = body.get('status', 'cancelled')
            cur.execute(f"""
                UPDATE {SCHEMA}.transactions SET status = %s WHERE id = %s
                RETURNING id, amount, status, card_mask, created_at
            """, (new_status, tx_id))
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
            return {
                'statusCode': 200,
                'headers': cors,
                'body': json.dumps({
                    'id': row[0], 'amount': row[1], 'status': row[2],
                    'card_mask': row[3], 'created_at': row[4].isoformat()
                }, ensure_ascii=False),
            }

        # DELETE — удалить транзакцию
        if method == 'DELETE':
            tx_id = int(params.get('id', 0))
            cur.execute(f"DELETE FROM {SCHEMA}.transactions WHERE id = %s", (tx_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    finally:
        cur.close()
        conn.close()
