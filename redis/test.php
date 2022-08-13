<?php

require __DIR__ . "/vendor/predis/predis/autoload.php";
Predis\Autoloader::register();

$client = new Predis\Client(['password' => 'sdkjgoiudjbij49r8fiufj48fkfk49spht956054kfjfu4jegtfkgk4']);
$client->set('foo', 'bar');
$value = $client->get('testd');

if ($value === NULL) echo "is null\n";
echo "value: $value:" . gettype($value) . "\n";
