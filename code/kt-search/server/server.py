#
import json
import os
import base64
import pandas as pd
import asyncio
from aiohttp import web
import aiohttp_cors
from minio import Minio
from minio.error import S3Error
import traceback
import codecs
import io
import csv
import urllib3

KTSC_CSV_PORT = os.getenv('KTSC_CSV_PORT', '9080')
KTSC_CSV_ENCODING = os.getenv('KTSC_CSV_ENCODING', 'euc-kr')
KTSC_CSV_MAXLINES = os.getenv('KTSC_CSV_MAXLINES', '50000')
KTSC_S3_ENDPOINT = os.getenv('KTSC_S3_ENDPOINT', '127.0.0.1:9000')
KTSC_S3_ACCESSKEY = os.getenv('KTSC_S3_ACCESSKEY', 'CiJkleH9J414Cno0QTxS')
KTSC_S3_SECRETKEY = os.getenv('KTSC_S3_SECRETKEY', 'gnb31k6WmkWSy7iXMYwJ7g478mMiRNfWplDYVmYA')
KTSC_S3_SSL = os.getenv('KTSC_S3_SSL', 'false')

KTSC_CSV_PORT = int(KTSC_CSV_PORT)
KTSC_CSV_MAXLINES = int(KTSC_CSV_MAXLINES)
KTSC_S3_SSL = True if KTSC_S3_SSL == 'true' else False

httpClient = urllib3.PoolManager(
  timeout=urllib3.Timeout.DEFAULT_TIMEOUT,
  cert_reqs='CERT_NONE',
  retries=urllib3.Retry(
    total=5,
    backoff_factor=0.2,
    status_forcelist=[500, 502, 503, 504]
  )
)
s3 = Minio(
    KTSC_S3_ENDPOINT,
    access_key=KTSC_S3_ACCESSKEY,
    secret_key=KTSC_S3_SECRETKEY,
    secure=KTSC_S3_SSL,
    http_client=httpClient
)

async def health(request):
  return web.json_response({ 'status': 'ok' })

async def s3_buckets(request):
  return web.json_response({ 'status': 'ok' })

async def s3_objects(request):  
  bucket = request.rel_url.match_info['bucket']
  try:
    pass            
  except Exception as e:
    return web.json_response({'error': traceback.format_exc()})
  finally:
    pass
  return web.json_response({ 'status': 'ok' })

async def csv_preview(request):
    bucket = request.rel_url.query.get('bucket', '')
    prefix = request.rel_url.query.get('prefix', '')
    version_id = request.rel_url.query.get('version_id', '')
    format = request.rel_url.query.get('format', '')
    filter = request.rel_url.query.get('filter', '')
    start = request.rel_url.query.get('start', '')
    limit = request.rel_url.query.get('limit', '')
    header = request.rel_url.query.get('header', '')
    
    try:
      start = int(start)
    except:
      start = 0
    try:
      limit = int(limit)
    except:
      limit = 50
    try:
      header = int(header)
    except:
      header = 0
    
    skip = header
    
    try:
      if filter:
        filter = base64.b64decode(filter).decode('utf-8')
    except:
      pass

    filter_code = None
    try:
      if filter:
        filter_code = compile(filter, "<string>", "exec")  
    except:
      pass
    
    if False:
      filter = '''
def _filter(i, row):
  if i == 0:
    return True
  if len(row):
    return True
  return False
filtered = _filter(i, row)
'''
    if version_id == 'null':
      version_id = None

    remaining = 0
    offset = 0
    chunk = 1024 * 1024
    encoding = None
    buf = None
    
    try:
      
      object_name = base64.b64decode(prefix).decode('utf-8')

      if format:
        headers = {'Content-Type': 'application/json'}
      else:
        headers = {
          'Content-Description': 'File Transfer',
          'Content-Transfer-Encoding': 'binary',
          'Content-Disposition': f'attachment; filename={object_name}',
          'Content-Type': 'application/octet-stream',
        }
      response = web.StreamResponse(status=200, reason='OK', headers=headers)
      response.enable_compression(web.ContentCoding.gzip)
      await response.prepare(request)

      stat = s3.stat_object(bucket_name=bucket, object_name=object_name, version_id=version_id)
      remaining = stat.size
      print(f"content_type: {stat.content_type} size: {remaining}")
      
      if format == 'lucky':
        await response.write('''{
  "celldata": [
'''.encode('utf-8'))
      elif format == 'ag':
        await response.write('''{ "rows": [ '''.encode('utf-8'))
      
      needcomma = False
      nrows = 0
      ncols = 0
      r0 = -1
      r1 = -1
      shouldbreak = False
      headers = []

      while True:
        if remaining <= 0:
          break

        try:
          with s3.get_object(bucket_name=bucket, object_name=str(object_name), version_id=version_id, offset=offset, length=min(chunk, remaining)) as s3resp:
            b = s3resp.read()
        except Exception:
          await response.write(json.dumps({'error': traceback.format_exc()}).encode('utf-8'))
          return response

        if offset == 0:
          if b.startswith(codecs.BOM_UTF8):
            encoding = 'utf-8'
            b = b[2:]
          else:
            encoding = KTSC_CSV_ENCODING

        offset += len(b)
        remaining -= len(b)

        if buf:
          b = buf + b
        
        if not b'\n' in b and remaining > 0:
          buf = b
          continue
        
        if remaining > 0:
          last = b.rfind(b'\n')
          if last >= 0:
            buf = b[last+1:]
            b = b[:last+1]

        lines = b.decode(encoding).splitlines()
        for line in lines:
          if nrows == header-1:
            reader = csv.reader(io.StringIO(line), delimiter=',')
            for row in reader:
              for cell in row:
                headers.append(cell)
            
          if nrows < start + skip:
            nrows += 1
            if nrows >= start + skip + limit or nrows >= KTSC_CSV_MAXLINES:
              shouldbreak = True
              break
            continue
          if nrows >= start + skip + limit:
            shouldbreak = True
            break

          reader = csv.reader(io.StringIO(line), delimiter=',')

          col = 0
          item = {}

          filtered = False
          g = globals()
          l = { 'i': nrows - skip, 'row': [] }
          
          if filter_code and len(line) <= 0:
            l['row'] = []
            exec(filter_code, g, l)
            filtered = l['filtered'] if 'filtered' in l else False
            
          for row in reader:
            if filter_code:
              l['row'] = row
              exec(filter_code, g, l)
              filtered = l['filtered'] if 'filtered' in l else False
            
            for cell in row:
              if format == 'lucky':
                if needcomma:
                  await response.write(b',')
                await response.write(json.dumps({ 'r': nrows, 'c': col, 'v': { 'm': cell, 'v': cell, 'ct': { 'fa': '@', 't': 's' } } }).encode('utf-8'))
                needcomma = True

              elif format == 'ag':
                item[col] = cell

              col = col + 1
              if ncols < col:
                ncols = col
          
          if not format:
            await response.write(line.encode('utf-8'))
            await response.write(b'\n')
          elif format == 'ag':
            if needcomma:
              await response.write(b',')
            if filtered: item['meta'] = { 'HL': 1 }
            await response.write(json.dumps(item).encode('utf-8'))
            await response.write(b'\n')
            needcomma = True
          
          if r0 < 0:
            r0 = nrows
          if r1 <= nrows:
            r1 = nrows

          nrows = nrows + 1

          if nrows >= start + skip + limit:
            shouldbreak = True
            break

          if nrows >= KTSC_CSV_MAXLINES:
            shouldbreak = True
            break

        if shouldbreak:
          break
      
      #if writeBuffer:        await response.write(writeBuffer.getvalue())
      
      if format == 'lucky':
        await response.write(f'''
  ],
  "nrows": {nrows},
  "ncols": {ncols}
{"}"}'''.encode('utf-8'))
      elif format == 'ag':
        await response.write(f'''],
  "nrows": {nrows}, "ncols": {ncols}, "r0": {r0}, "r1": {r1},
  "headers": {json.dumps(headers)}
{"}"}
'''.encode('utf-8'))

      print("num_lines", nrows)
      
    except Exception as e:
      await response.write(json.dumps({'error': traceback.format_exc()}).encode('utf-8'))
      return response

    finally:
      pass

    await response.write_eof()
    return response

app = web.Application()
app.add_routes([web.get('/ktsearch', health),
                web.get('/ktsearch/s3/buckets', s3_buckets),
                web.get('/ktsearch/s3/{bucket}/objects', s3_objects),
                web.get('/ktsearch/csv/preview', csv_preview),
              ])

cors = aiohttp_cors.setup(app, defaults={
   "*": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*"
    )
  })

for route in list(app.router.routes()):
  cors.add(route)
    
if __name__ == '__main__':
    web.run_app(app, port=KTSC_CSV_PORT)
