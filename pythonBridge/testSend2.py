import optparse
from OSC import *
from OSC import _readString, _readFloat, _readInt

c = OSCClient()
c.connect(('127.0.0.1',7600))
print c

m = OSCMessage("/test/1")
m += [44, 11, 4.5, "the white cliffs of dover"]
#m += [1.0, 1.0, 0.0, 1.0]

c.send(m)

c.close()
