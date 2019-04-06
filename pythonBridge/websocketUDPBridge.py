import time, sys, os, pkg_resources

import SocketServer

from twisted.python import log
from twisted.internet import reactor, ssl
from twisted.application import service
from twisted.internet.protocol import DatagramProtocol, Protocol, Factory

from twisted.web.server import Site
from twisted.web.static import File

from autobahn.twisted.websocket import WebSocketServerProtocol, \
                                       WebSocketServerFactory, \
                                       listenWS

from autobahn.twisted.resource import WebSocketResource, \
                              HTTPChannelHixie76Aware

# constants

# Me to receive
SERVER_IP = '127.0.0.1'
SERVER_UDP_PORT = 7600
SERVER_WS_PORT = 8000
SERVER_HTTP_PORT = 9000
SERVER_HTTP_RESOURCES = 'web'

# To someone/thing else
# to Bela
CLIENT_IP = '192.168.7.2'
CLIENT_UDP_PORT = 7562
#remote
# CLIENT_IP = '10.0.0.1'
# CLIENT_UDP_PORT = 7500
#local
# CLIENT_IP = '127.0.0.1'
# CLIENT_UDP_PORT = 8888



# [HTTP] > [CLIENT WS] > [SERVER WS] > bridge > [SERVER UDP] > [CLIENT UDP]

class Bridge():

  def __init__(self):
    self.udpServer = None
    self.wsServer = None

  def setUdpServer(self, udpServer):
    self.udpServer = udpServer

  def setWebsocketServer(self, wsServer):
    self.wsServer = wsServer

  def udpToWebsocket(self, data):
    if self.wsServer is not None:
      self.wsServer.sendMessage(data, True)

  def websocketToUdp(self, data):
    if self.udpServer is not None:
      self.udpServer.transport.write(data, (CLIENT_IP, CLIENT_UDP_PORT))

# udp server

class UDPServer(DatagramProtocol):

  def __init__(self, bridge):
    self.bridge = bridge
    self.bridge.setUdpServer(self)

  def datagramReceived(self, data, (host, port)):
    self.bridge.udpToWebsocket(data)
    #print data

# websocket server

class BridgedWebSocketServerFactory(WebSocketServerFactory):

  def __init__(self, url, debug, debugCodePaths, bridge):
    WebSocketServerFactory.__init__(self, url, debug = debug, debugCodePaths = debugCodePaths)
    self.bridge = bridge

class WebSocketServer(WebSocketServerProtocol):

  def onOpen(self):
    print 'WebSocket connection open.'

  def onConnect(self, request):
    self.factory.bridge.setWebsocketServer(self)
    print 'Client connecting: {0}'.format(request.peer)

  def onMessage(self, payload, isBinary):
    # print payload
    self.factory.bridge.websocketToUdp(payload)

  def onClose(self, wasClean, code, reason):
    print 'WebSocket connection closed: {0}'.format(reason)

# initalize servers

if __name__ == '__main__':

  bridge = Bridge()

  log.startLogging(sys.stdout)

  # websocket setup

  wsAddress = 'wss://%s:%d' % (SERVER_IP, SERVER_WS_PORT)

  contextFactory = ssl.DefaultOpenSSLContextFactory('/etc/apache2/ssl/localhost.key',
                                                    '/etc/apache2/ssl/localhost.crt')

  factory = BridgedWebSocketServerFactory(wsAddress, False, False, bridge)
  factory.protocol = WebSocketServer
  reactor.listenSSL(SERVER_WS_PORT, factory, contextFactory)

  # reactor.listenTCP(SERVER_WS_PORT, factory)

  # http setup

  webdir = os.path.abspath(SERVER_HTTP_RESOURCES)
  site = Site(File(webdir))
  site.protocol = HTTPChannelHixie76Aware
  reactor.listenTCP(SERVER_HTTP_PORT, site)

  # udp setup

  reactor.listenUDP(SERVER_UDP_PORT, UDPServer(bridge))

  # start session

  reactor.run()

