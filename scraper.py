from BeautifulSoup import BeautifulStoneSoup # For processing XML
from optparse import OptionParser

import re, logging, os

#
# helper
#

def playlists_xml_to_json(content):

  data = []
  soup = BeautifulStoneSoup(content)
  for track in soup('playlist'):
    data.append({
    'playlistname': track.playlistname.contents[0],
    'playlistid': track.playlistid.contents[0]
    })
    
    if track.showdj and track.showdj.contents:
      data['showdj'] = ''.joint(track.showdj.contents)

  return data

        
def artists_xml_to_json(content):

  data = []
  soup = BeautifulStoneSoup(content)
  for track in soup('contributor'):
    data.append({
    'showid': track.showid.contents[0],
    'showtitle': track.showtitle.contents[0],
    'showlocation': track.showlocation.contents[0],
    'showphoto': track.showphoto.contents[0]
    })
    
  data = sorted(data, key=lambda track: track['showtitle'])

  return data
  

def show_xml_to_json(content):
  
  data = []
  soup = BeautifulStoneSoup(content)
  for track in soup('track'):
    arr = {
      'location': track.location.contents[0].strip(),
      'artist': track.artist.contents[0].strip(),
    }
    if track.album and track.album.contents:
      arr['album'] = track.album.contents[0].strip()
      
    data.append(arr)
    
  show = {
    'data': data,
  }
  
  if soup('showphoto') and soup('showphoto')[0].contents:
    show['showphoto'] = ''.join(soup('showphoto')[0].contents)
  
  if soup('showdesc'):
    
    def process_html(html):
      
      r = re.compile(r"([^ ]+\.com[a-zA-Z0-9_/&=\-.]*)")
      html = r.sub(r'<a href="http://\1">\1</a>', html)
      
      r = re.compile(r"([^ ]+\.ly[a-zA-Z0-9_/&=\-.]*)")
      html = r.sub(r'<a href="http://\1">\1</a>', html)
      
      return html
    
    show['showdesc'] = ''.join(soup('showdesc')[0].contents)
    show['showdesc_html'] = process_html(show['showdesc'])
    
  if soup('showtitle'):
    show['showtitle'] = ''.join(soup('showtitle')[0].contents)

  if soup('showdj'):
    show['showdj'] = ''.join(soup('showdj')[0].contents)
  
  logging.info(show)
  
  return show
  
    
if __name__ == '__main__':
  
  parser = OptionParser()
  parser.add_option("-p", "--path", dest="path", help="path to save data", default='./')

  (options, args) = parser.parse_args()
  root_path = os.path.abspath(options.path) + "/"
  
  print "Saving to path: %s" % root_path
  
  import requests
  r = requests.get('http://www.viva-radio.com/xml/getcontribs_live.php?tzone=%d' % (-4))
  data = artists_xml_to_json(r.text)
  for item in data:
    r = requests.get('http://www.viva-radio.com/xml/getartist_live.php?aid=%d&tzone=%d' % (int(item['showid']), -4))
    playlists = playlists_xml_to_json(r.text)
    for playlist in playlists:
      r = requests.get('http://www.viva-radio.com/xml/getshow.php?aid=%d&playlist=%d&tzone=%d' % (int(item['showid']), int(playlist['playlistid']), -4))
      show = show_xml_to_json(r.text)
      
      showtitle = re.sub('[^\w\s-]', '', item['showtitle'].strip())
      try:
        os.makedirs(root_path + show['showdj'].strip() + "/" + showtitle)
      except:
        pass
        
      path, ext = os.path.splitext(show['showphoto'])
      r = requests.get(show['showphoto'])
      path = root_path + show['showdj'].strip() + "/" + showtitle + "/cover" + ext
      with open(path, 'wb') as f:
        print show['showphoto'], "->", path #, f, r.raw
        f.write(r.raw.data)
      
      i = 1
      for track in show['data']:
        path, ext = os.path.splitext(track['location'])
        if track.has_key('album'):
          name = track['album'].strip()
        if len(name):
          name = name + " - "
        name = name + track['artist'].strip()
        
        trackname = str(i) + " " + name
        trackname = re.sub('[^\w\s-]', '', trackname)
        
        path = root_path + show['showdj'].strip() + "/" + showtitle + "/" + trackname + ext
        r = requests.get(track['location'])
        with open(path, 'wb') as f:
          print track['location'], "->", path #, f, r.raw
          f.write(r.raw.data)
          
        i = i + 1        