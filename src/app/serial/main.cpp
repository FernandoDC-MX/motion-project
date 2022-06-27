#include <iostream>
#include <sstream>
#include <cstring>
#include <string>
#include <stdlib.h>
#include <ctime>
//#include "SerialPort.h"

using namespace std;

#define MAC_SIZE 18
#define FNAME_SIZE 20
#define CMD_SIZE 4

#ifndef SERIALPORT_H
#define SERIALPORT_H

#define ARDUINO_WAIT_TIME 2000
#define MAX_DATA_LENGTH 1024

#include <windows.h>
#include <stdio.h>
#include <stdlib.h>

class SerialPort
{
private:
    HANDLE handler;
    bool connected;
    COMSTAT status;
    DWORD errors;
public:
    SerialPort(char *portName);
    ~SerialPort();

    int readSerialPort(char *buffer, unsigned int buf_size);
    bool writeSerialPort(char *buffer, unsigned int buf_size);
    bool isConnected();
};

#endif // SERIALPORT_H

SerialPort::SerialPort(char *portName)
{
    this->connected = false;

    this->handler = CreateFileA(static_cast<LPCSTR>(portName),
                                GENERIC_READ | GENERIC_WRITE,
                                0,
                                NULL,
                                OPEN_EXISTING,
                                FILE_ATTRIBUTE_NORMAL,
                                NULL);
    if (this->handler == INVALID_HANDLE_VALUE){
        if (GetLastError() == ERROR_FILE_NOT_FOUND){
            printf("ERROR: Handle was not attached. Reason: %s not available\n", portName);
        }
    else
        {
            printf("ERROR!!!");
        }
    }
    else {
        DCB dcbSerialParameters = {0};

        if (!GetCommState(this->handler, &dcbSerialParameters)) {
            printf("failed to get current serial parameters");
        }
        else {
            dcbSerialParameters.BaudRate = CBR_115200;
            dcbSerialParameters.ByteSize = 8;
            dcbSerialParameters.StopBits = ONESTOPBIT;
            dcbSerialParameters.Parity = NOPARITY;
            dcbSerialParameters.fDtrControl = DTR_CONTROL_DISABLE;

            if (!SetCommState(handler, &dcbSerialParameters))
            {
                printf("ALERT: could not set Serial port parameters\n");
            }
            else {
                this->connected = true;
                PurgeComm(this->handler, PURGE_RXCLEAR | PURGE_TXCLEAR);
                Sleep(ARDUINO_WAIT_TIME);
            }
        }
    }
}

SerialPort::~SerialPort()
{
    if (this->connected){
        this->connected = false;
        CloseHandle(this->handler);
    }
}

int SerialPort::readSerialPort(char *buffer, unsigned int buf_size)
{
    DWORD bytesRead;
    unsigned int toRead = 0;

    ClearCommError(this->handler, &this->errors, &this->status);

    if (this->status.cbInQue > 0){
        if (this->status.cbInQue > buf_size){
            toRead = buf_size;
        }
        else toRead = this->status.cbInQue;
    }

    if (ReadFile(this->handler, buffer, toRead, &bytesRead, NULL)) return bytesRead;

    return 0;
}

bool SerialPort::writeSerialPort(char *buffer, unsigned int buf_size)
{
    DWORD bytesSend;

    if (!WriteFile(this->handler, (void*) buffer, buf_size, &bytesSend, 0)){
        ClearCommError(this->handler, &this->errors, &this->status);
        return false;
    }
    else return true;
}

bool SerialPort::isConnected()
{
    return this->connected;
}

uint8_t mac_addrs[6];
char name_snsr[FNAME_SIZE] = "";
char mac_snsr[MAC_SIZE] = "";
char output[MAX_DATA_LENGTH];

char cmd_to_brain[CMD_SIZE];

typedef struct __attribute__((packed)) {
	char cmd[CMD_SIZE];
    uint8_t mac[6];
	char friendly_name[FNAME_SIZE];    
	uint8_t edo_con;
	uint8_t tiempo;
	uint8_t color;
	uint8_t bateria;
}packet_t;


packet_t pack_to_brain;
char* buffer;

void delay(int secs) {
  for(int i = (time(NULL) + secs); time(NULL) != i; time(NULL));
}

void send_cmd_to_brain(string p_cmd, string p_string_info, uint8_t p_uint8_info, uint8_t p_uint8_info2){
	cout<<"Comando: "<<p_cmd<<endl;
	memset(&pack_to_brain, 0, sizeof(packet_t));
	memset(pack_to_brain.cmd, '\0', CMD_SIZE);
	memset(pack_to_brain.mac, '\0', 6);
	memset(pack_to_brain.friendly_name, '\0', FNAME_SIZE);
	memcpy(pack_to_brain.cmd,p_cmd.c_str(),CMD_SIZE);
	memcpy(pack_to_brain.mac,mac_addrs,6);
	memcpy(pack_to_brain.friendly_name,p_string_info.c_str(),FNAME_SIZE);
	if(p_cmd == "COL" || p_cmd == "ADD") pack_to_brain.color = p_uint8_info;
	if(p_cmd == "TIM") pack_to_brain.tiempo = p_uint8_info;
	if(p_cmd == "ADD") pack_to_brain.tiempo = p_uint8_info2;
	buffer = (char*)malloc(sizeof(packet_t));
	memcpy(buffer,&pack_to_brain,sizeof(packet_t));
	//arduino.writeSerialPort(buffer, sizeof(packet_t));
	//free(buffer);
	}

void recv_cmd_of_brain(){
	//delay(2);	
	//arduino.readSerialPort(buffer, sizeof(packet_t));
	memset(&pack_to_brain, 0, sizeof(packet_t));
	memcpy(&pack_to_brain,buffer,sizeof(packet_t));

	//cout<<pack_to_brain.cmd<<endl;

	if((string)pack_to_brain.cmd == "TST" || (string)pack_to_brain.cmd == "INF")
		printf("%d\n", pack_to_brain.edo_con);

	if((string)pack_to_brain.cmd == "BAT" || (string)pack_to_brain.cmd == "INF")
		printf("%d\n", pack_to_brain.bateria);
	
	//cout<< hex <<unsigned(pack_to_brain.mac[0])<<":"<<unsigned(pack_to_brain.mac[1])<<":"<<unsigned(pack_to_brain.mac[2])<<":"<<unsigned(pack_to_brain.mac[3])<<":"<<unsigned(pack_to_brain.mac[4])<<":"<<unsigned(pack_to_brain.mac[5])<<endl;
	if((string)pack_to_brain.cmd == "NOM" || (string)pack_to_brain.cmd == "INF")
		cout<<pack_to_brain.friendly_name<<endl;
	if((string)pack_to_brain.cmd == "COL" || (string)pack_to_brain.cmd == "INF")
		printf("%d\n", pack_to_brain.color);
	if((string)pack_to_brain.cmd == "TIM" || (string)pack_to_brain.cmd == "INF")
		printf("%d\n", pack_to_brain.tiempo);
	free(buffer);
	
}

void recv_cmd_debug(){
	//delay(2);
	//arduino.readSerialPort(output, sizeof(output));
	cout<<output;
	memset(output, 0, sizeof(output));
}

int main(int argc, char* argv[]){
	//cout << "Have " << argc << " arguments" << endl;
	
	string parametro, parametro_2, parametro_3, com, m;

	//cmd_to_brain = argv[1] ;
	strcpy(cmd_to_brain, argv[1]);
	//cout << cmd_to_brain <<endl;

	//strcpy(mac_snsr, argv[1]);
	m = argv[2];
	//cout << m <<endl;
	sscanf(m.c_str(), "%2hhx:%2hhx:%2hhx:%2hhx:%2hhx:%2hhx", &mac_addrs[0], &mac_addrs[1], &mac_addrs[2], &mac_addrs[3], &mac_addrs[4], &mac_addrs[5]);
	//cout << hex << mac_addrs[0] <<endl;

	com = argv[3];
	//cout << com <<endl;

	com = "\\\\.\\" + com; 
	//cout << com <<endl;

	//char *port = com;

	char *port = new char[com.length() + 1];
	strcpy(port, com.c_str());
	SerialPort arduino(port);

	if(arduino.isConnected()){ 
		
		//cout<<"Connection made"<<endl<<endl;
		if ((string)cmd_to_brain == "ADD"){
			parametro = argv[4];
			//cout << parametro <<endl;
			parametro_2 = argv[5];
			//cout << parametro_2 <<endl;
			parametro_3 = argv[6];
			//cout << parametro_2 <<endl;
			if(parametro == "0")
				parametro = "";
			strcpy(name_snsr, parametro.c_str());
			send_cmd_to_brain(cmd_to_brain, name_snsr, stoi(parametro_2), stoi(parametro_3));
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			delay(2);
			arduino.readSerialPort(output, sizeof(output));
			recv_cmd_debug();}

		else if ((string)cmd_to_brain == "DEL"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			delay(2);
			arduino.readSerialPort(output, sizeof(output));
			recv_cmd_debug();}
		
		else if((string)cmd_to_brain == "LSS"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			delay(2);
			arduino.readSerialPort(output, sizeof(output));
			recv_cmd_debug();}
		
		else if((string)cmd_to_brain == "STR"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));}

		else if((string)cmd_to_brain == "STP"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));}

		else if((string)cmd_to_brain == "TST"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			delay(2);
			arduino.readSerialPort(buffer, sizeof(packet_t));
			recv_cmd_of_brain();}
		
		else if((string)cmd_to_brain == "BAT"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			delay(2);
			arduino.readSerialPort(buffer, sizeof(packet_t));
			recv_cmd_of_brain();}
		
		else if((string)cmd_to_brain == "INF"){
			send_cmd_to_brain(cmd_to_brain, "",0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			delay(2);
			arduino.readSerialPort(buffer, sizeof(packet_t));
			recv_cmd_of_brain();}
		
		else if((string)cmd_to_brain == "TIM"){
			parametro = argv[4];
			//cout << parametro <<endl;
			send_cmd_to_brain(cmd_to_brain, "",stoi(parametro),0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			if(stoi(parametro) == 0){
				delay(2);
				arduino.readSerialPort(buffer, sizeof(packet_t));
				recv_cmd_of_brain();}}

		else if((string)cmd_to_brain == "NOM"){
			parametro = argv[4];
			//cout << parametro <<endl;
			if(parametro == "0")
				parametro = "";
			strcpy(name_snsr, parametro.c_str());
			send_cmd_to_brain(cmd_to_brain, name_snsr,0,0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			if(parametro == ""){
				delay(2);
				arduino.readSerialPort(buffer, sizeof(packet_t));	
				recv_cmd_of_brain();}}

		else if((string)cmd_to_brain == "COL"){
			parametro = argv[4];
			//cout << parametro <<endl;
			send_cmd_to_brain(cmd_to_brain, "",stoi(parametro),0);
			arduino.writeSerialPort(buffer, sizeof(packet_t));
			if(stoi(parametro) == 0){
				delay(2);
				arduino.readSerialPort(buffer, sizeof(packet_t));
				recv_cmd_of_brain();}}
		
		
	}

	else cout<<"Error in port name"<<endl<<endl;
	
	return 0;
}