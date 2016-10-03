#!/usr/bin/env python
# copyright Roman Haefeli https://github.com/reduzent/pyslip

# SLIP decoder
class slip():

	def __init__(self):
		self.started = False
		self.escaped = False
		self.stream = ''
		self.packet = ''
		self.SLIP_END = '\xc0'		# dec: 192
		self.SLIP_ESC = '\xdb'		# dec: 219
		self.SLIP_ESC_END = '\xdc'	# dec: 220
		self.SLIP_ESC_ESC = '\xdd'	# dec: 221

	def append(self, chunk):
		self.stream += chunk

	def decode(self):
		packetlist = []
		for char in self.stream:
			# SLIP_END
			if char == self.SLIP_END:
				if self.started:
					if len(self.packet) > 0:
						self.started = False
						packetlist.append(self.packet)
						self.packet = ''
				else:
					self.started = True
					self.packet = ''
			# SLIP_ESC
			elif char == self.SLIP_ESC:
				self.escaped = True
			# SLIP_ESC_END
			elif char == self.SLIP_ESC_END:
				if self.escaped:
					self.packet += self.SLIP_END
					self.escaped = False
				else:
					self.packet += char
			# SLIP_ESC_ESC
			elif char == self.SLIP_ESC_ESC:
				if self.escaped:
					self.packet += self.SLIP_ESC
					self.escaped = False
				else:
					self.packet += char
			# all others
			else:
				if self.escaped:
					print "error in SLIP packet"
					self.packet = ''
					self.escaped = False
				else:
					self.packet += char
		self.stream = ''
		return (packetlist)

	def encode(self, packet):
		encoded = self.SLIP_END
		for char in packet:
			# SLIP_END
			if char == self.SLIP_END:
				encoded +=  self.SLIP_ESC + self.SLIP_ESC_END
			# SLIP_ESC
			elif char == self.SLIP_ESC:
				encoded += self.SLIP_ESC + self.SLIP_ESC_ESC
			# the rest can simply be appended
			else:
				encoded += char
		encoded += self.SLIP_END
		return (encoded)

