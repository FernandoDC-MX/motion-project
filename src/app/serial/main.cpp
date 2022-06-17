#include<iostream>
#include <sstream>
#include<cstring>
#include<string>
#include<stdlib.h>
#include<ctime>
#include"SerialPort.h"

using namespace std;

#define MAC_SIZE 18
#define FNAME_SIZE 20
#define CMD_SIZE 4

char name_snsr[FNAME_SIZE] = "";
char mac_snsr[MAC_SIZE] = "4C:75:25:DE:8B:60";
char output[MAX_DATA_LENGTH];
char *port = "\\\\.\\COM6";
char cmd_to_brain[CMD_SIZE];

typedef struct __attribute__((packed)) {
	char cmd[CMD_SIZE];
    char mac[MAC_SIZE];
	char friendly_name[FNAME_SIZE];    
	uint8_t edo_con;
	uint8_t tiempo;
	uint8_t color;
	uint8_t bateria;
}packet_t;

SerialPort arduino(port);
packet_t pack_to_brain;
char* buffer;

void delay(int secs) {
  for(int i = (time(NULL) + secs); time(NULL) != i; time(NULL));
}

void send_cmd_to_brain(string p_mac, string p_cmd, string p_string_info, uint8_t p_uint8_info){
	cout<<"Comando: "<<p_cmd<<endl;
	memset(&pack_to_brain, 0, sizeof(packet_t));
	memset(pack_to_brain.cmd, '\0', CMD_SIZE);
	memset(pack_to_brain.mac, '\0', MAC_SIZE);
	memset(pack_to_brain.friendly_name, '\0', FNAME_SIZE);
	memcpy(pack_to_brain.cmd,p_cmd.c_str(),CMD_SIZE);
	memcpy(pack_to_brain.mac,p_mac.c_str(),MAC_SIZE);
	memcpy(pack_to_brain.friendly_name,p_string_info.c_str(),FNAME_SIZE);
	if(p_cmd == "COL")	pack_to_brain.color = p_uint8_info;
	if(p_cmd == "TIM")	pack_to_brain.tiempo = p_uint8_info;
	buffer = (char*)malloc(sizeof(packet_t));
	memcpy(buffer,&pack_to_brain,sizeof(packet_t));
	arduino.writeSerialPort(buffer, sizeof(packet_t));
	free(buffer);}

void recv_cmd_of_brain(){
	delay(2);	
	arduino.readSerialPort(buffer, sizeof(packet_t));
	memset(&pack_to_brain, 0, sizeof(packet_t));
	memcpy(&pack_to_brain,buffer,sizeof(packet_t));

	cout<<pack_to_brain.cmd<<endl;
	cout<<pack_to_brain.mac<<endl;
	cout<<pack_to_brain.friendly_name<<endl;
	printf("%d\n", pack_to_brain.color);
	printf("%d\n", pack_to_brain.tiempo);
	printf("%d\n", pack_to_brain.edo_con);
	printf("%d\n", pack_to_brain.bateria);
}

int main(int argc, char* argv[]){
	//cout << "Have " << argc << " arguments" << endl;
	
	string parametro;
	
	//cmd_to_brain = argv[1] ;
	strcpy(cmd_to_brain, argv[1]);
	//cout << cmd_to_brain <<endl;

	parametro = argv[2] ;
	//cout << parametro <<endl;

	if(arduino.isConnected()){ 
		
		//cout<<"Connection made"<<endl<<endl;
	

		if((string)cmd_to_brain == "STR")
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",0);

		if((string)cmd_to_brain == "STP")
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",0);

		if((string)cmd_to_brain == "TST"){
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",0);
			recv_cmd_of_brain();}
		
		if((string)cmd_to_brain == "BAT"){
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",0);
			recv_cmd_of_brain();}
		
		if((string)cmd_to_brain == "INF"){
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",0);
			recv_cmd_of_brain();}

		if((string)cmd_to_brain == "NOM"){
			if(parametro == "0")
				parametro = "";
			strcpy(name_snsr, parametro.c_str());
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, name_snsr,0);
			if(parametro == "")recv_cmd_of_brain();}

		if((string)cmd_to_brain == "COL"){
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",stoi(parametro));
			if(stoi(parametro) == 0)recv_cmd_of_brain();}
		
		if((string)cmd_to_brain == "TIM"){
			send_cmd_to_brain("4C:75:25:DE:8B:60", cmd_to_brain, "",stoi(parametro));
			if(stoi(parametro) == 0)recv_cmd_of_brain();}
	}

	else cout<<"Error in port name"<<endl<<endl;
	
	return 0;
}