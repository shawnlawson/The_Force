import optparse
from OSC import *
from OSC import _readString, _readFloat, _readInt

if __name__ == "__main__":

    s = OSCServer(("codafett.local", 7500), return_port=7500)
    s.addMsgHandler("/analog/0", s.msgPrinter_handler)

    print s

    st = threading.Thread(target=s.serve_forever)
    st.start()

    try:
        while True:
            time.sleep(30)

    except KeyboardInterrupt:
        print "\nClosing OSCServer."
        s.close()
        print "Waiting for Server-thread to finish"
        st.join()

    sys.exit(0)
