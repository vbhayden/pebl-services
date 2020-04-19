# PeBL services


To restrict ssh to only allow port forwarding on redis client port  

command="echo 'Port forwarding for only.'",restrict,port-forwarding,permitopen="localhost:6379",permitopen="127.0.0.1:6379"  
