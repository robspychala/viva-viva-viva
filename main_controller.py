#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os, logging, re

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import urlfetch

from django.utils import simplejson as json

import site_util

from BeautifulSoup import BeautifulStoneSoup # For processing XML

class GetArtistsHandler(webapp.RequestHandler):
  
  # http://www.viva-radio.com//xml/getcontribs_live.php?tzone=-4

  def get(self):
    
    self.response.out.write(json.dumps(fetch_artists(-4)))
    
class GetPlaylistsHandler(webapp.RequestHandler):

  # http://www.viva-radio.com//xml/getartist_live.php?aid=152&tzone=-4
  def get(self):
    
    self.response.out.write(json.dumps(fetch_playlists(int(self.request.get("showid")), -4)))

class MainHandler(webapp.RequestHandler):
  
  def get(self):
    
    aid = self.request.get("aid", None)
    playlistid = self.request.get("playlistid", None)
    
    if aid and playlistid:    
      self.template_values = fetch_show(int(aid),
                                        int(playlistid),
                                        -4)
    else:
      self.template_values = {}
    
    self.template_values.update({
      'prod': site_util.is_production(),
      'aid': aid,
      'playlistid': playlistid
    })
    
    logging.info(self.template_values)
  
    path = os.path.join(os.path.dirname(__file__), 'templates/main.html')
    self.response.out.write(template.render(path, self.template_values))

#
# helper
#

def fetch_playlists_xml_url(url):

  result = urlfetch.fetch(url)

  if result.status_code == 200:

    data = []
    soup = BeautifulStoneSoup(result.content)
    for track in soup('playlist'):
      data.append({
      'playlistname': track.playlistname.contents[0],
      'playlistid': track.playlistid.contents[0]
      })
      
      if track.showdj and track.showdj.contents:
        data['showdj'] = ''.joint(track.showdj.contents)

    return data

  else:

    return []
        
def fetch_artists_xml_url(url):

  result = urlfetch.fetch(url)

  if result.status_code == 200:

    data = []
    soup = BeautifulStoneSoup(result.content)
    for track in soup('contributor'):
      data.append({
      'showid': track.showid.contents[0],
      'showtitle': track.showtitle.contents[0],
      'showlocation': track.showlocation.contents[0],
      'showphoto': track.showphoto.contents[0]
      })
      
    data = sorted(data, key=lambda track: track['showtitle'])  

    return data

  else:

    return []

def fetch_show_xml_url(url):
  
  result = urlfetch.fetch(url)
  
  if result.status_code == 200:
    
    data = []
    soup = BeautifulStoneSoup(result.content)
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
    
  else:
    
    return {}

@site_util.memoize('fetch_playlists:%s,%s')
def fetch_playlists(artistid, timezone):

  url = 'http://www.viva-radio.com/xml/getartist_live.php?aid=%d&tzone=%d' % (artistid, timezone)
  logging.info(url)
  return {'data':fetch_playlists_xml_url(url)}

@site_util.memoize('fetch_artists:%s')    
def fetch_artists(timezone):

  url = 'http://www.viva-radio.com/xml/getcontribs_live.php?tzone=%d' % (timezone)
  logging.info(url)
  return {'data':fetch_artists_xml_url(url)}
          
@site_util.memoize('fetch_show:%s,%s,%s')
def fetch_show(artist_id, playlist, timezone):
  
  url = 'http://www.viva-radio.com/xml/getshow.php?aid=%d&playlist=%d&tzone=%d' % (artist_id, playlist, timezone)
  logging.info(url)
  return {'data':fetch_show_xml_url(url)}
  
#
#
#

#
# WSGI
#
  
def main():
  application = webapp.WSGIApplication([('/', MainHandler),
                                       ('/ajax/get_artists', GetArtistsHandler),
                                       ('/ajax/get_playlists', GetPlaylistsHandler)]
                                       , debug=True)
  util.run_wsgi_app(application)  
    
if __name__ == '__main__':
  main()
