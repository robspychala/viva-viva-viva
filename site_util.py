import os

from google.appengine.api import memcache

def is_production():
  return not os.environ.get('SERVER_SOFTWARE','').startswith('Devel')

def memoize(keyformat, time=60*60*4):
    """Decorator to memoize functions using memcache."""
    def decorator(fxn):
        def wrapper(*args, **kwargs):
            key = keyformat % args[0:keyformat.count('%')]
            data = memcache.get(key)
            if data is not None:
                return data
            data = fxn(*args, **kwargs)
            memcache.set(key, data, time)
            return data
        return wrapper
    return decorator