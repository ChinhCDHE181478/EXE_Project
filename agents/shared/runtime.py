from dataclasses import dataclass

from shared.utils.googlemaps_api import GoogleMapsAPI
from shared.utils.bookingcom_api import BookingComAPI


@dataclass
class ContextSchema:
    googlemaps_api: GoogleMapsAPI
    booking_api: BookingComAPI
