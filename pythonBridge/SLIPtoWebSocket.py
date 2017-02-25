import time, sys, os, pkg_resources
import slip

from twisted.internet.serialport import SerialPort

from twisted.python import log
from twisted.internet import reactor, ssl
from twisted.application import service
from twisted.internet.protocol import Protocol, Factory

from twisted.web.server import Site
from twisted.web.static import File

from autobahn.twisted.websocket import \
    WebSocketServerProtocol, WebSocketServerFactory, listenWS

from autobahn.twisted.resource import \
    WebSocketResource, HTTPChannelHixie76Aware


class Bridge():

    def __init__(self):
        self.serialServer = None
        self.wsServer = None

    def setSerialServer(self, sServer):
        self.serialServer = sServer

    def setWebsocketServer(self, wsServer):
        self.wsServer = wsServer

    def serialToWebsocket(self, data):
        if self.wsServer is not None:
            self.wsServer.sendMessage(data, True)

    def websocketToSerial(self, data):
        if self.serialServer is not None:
            self.serialServer.cmdReceived(data)


class USBClient(Protocol):

    def __init__(self, bridge):
        self.bridge = bridge
        # self.bridge.setSerialServer(self)
        self.slip_processor = slip.slip()

    def connectionFailed(self):
        print "Connection Failed:", self

    def connectionMade(self):
        # global serialServer
        # serialServer = self
        self.bridge.setSerialServer(self)
        print 'Arduino device: ', self.bridge.serialServer, ' is connected.'

    def dataReceived(self, data):
        # print "Data received! with %d bytes!" % len(data)
        self.slip_processor.append(data)
        slip_packets = self.slip_processor.decode()
        for packet in slip_packets:
            # print packet, '- from Arduino.'
            self.bridge.serialToWebsocket(packet)

    def cmdReceived(self, data):
        # print data
        cmd = self.slip_processor.encode(data)
        self.bridge.serialServer.transport.write(cmd)
        # print cmd, ' - sent to Arduino.'


class BridgedWebSocketServerFactory(WebSocketServerFactory):

    def __init__(self, url, debug, debugCodePaths, bridge):
        WebSocketServerFactory.__init__(self, url,
                                        debug=debug,
                                        debugCodePaths=debugCodePaths)
        self.bridge = bridge


class WebSocketServer(WebSocketServerProtocol):

    def onOpen(self):
        print 'WebSocket connection open.'

    def onConnect(self, request):
        self.factory.bridge.setWebsocketServer(self)
        print 'Client connecting: {0}'.format(request.peer)

    def onMessage(self, payload, isBinary):
        self.factory.bridge.websocketToSerial(payload)

    def onClose(self, wasClean, code, reason):
        print 'WebSocket connection closed: {0}'.format(reason)


if __name__ == '__main__':

    # port = '/dev/cu.usbmodema0111'
    port = '/dev/cu.usbmodem1411'
    # port = '/dev/cu.usbmodem14141'

    baudrate = 115200
    SERVER_IP = '127.0.0.1'
    SERVER_WS_PORT = 8000
    SERVER_HTTP_PORT = 9000
    SERVER_HTTP_RESOURCES = 'web'
    bridge = Bridge()

    log.startLogging(sys.stdout)

    # websocket setup
    wsAddress = 'wss://%s:%d' % (SERVER_IP, SERVER_WS_PORT)
    contextFactory = ssl.DefaultOpenSSLContextFactory('/etc/apache2/ssl/localhost.key',
                                                    '/etc/apache2/ssl/localhost.crt')
    wsfactory = BridgedWebSocketServerFactory(wsAddress, False, False, bridge)
    wsfactory.protocol = WebSocketServer
    reactor.listenSSL(SERVER_WS_PORT, wsfactory, contextFactory)

    # http setup
    webdir = os.path.abspath(SERVER_HTTP_RESOURCES)
    site = Site(File(webdir))
    site.protocol = HTTPChannelHixie76Aware
    reactor.listenTCP(SERVER_HTTP_PORT, site)

    usbclient = USBClient(bridge)

    print('About to open serial port {0} [{1} baud] ..'.format(port, baudrate))
    try:
        SerialPort(usbclient, port, reactor, baudrate=baudrate)
    except Exception as e:
        print('Could not open serial port: {0}'.format(e))

    reactor.run()
